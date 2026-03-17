import AVFoundation
import Foundation

enum CompressionError: Error, LocalizedError {
    case invalidArguments
    case unsupportedPreset(String)
    case cannotCreateExporter
    case unsupportedFileType
    case exportFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidArguments:
            return "Usage: swift scripts/compress-video.swift <input> <output> [480p|540p|720p|medium]"
        case .unsupportedPreset(let preset):
            return "Unsupported preset: \(preset)"
        case .cannotCreateExporter:
            return "Unable to create AVAssetExportSession for the requested preset."
        case .unsupportedFileType:
            return "The exporter cannot output MPEG-4 for this source/preset."
        case .exportFailed(let message):
            return "Video export failed: \(message)"
        }
    }
}

func presetName(for label: String) throws -> String {
    switch label.lowercased() {
    case "480p":
        return AVAssetExportPreset640x480
    case "540p":
        return AVAssetExportPreset960x540
    case "720p":
        return AVAssetExportPreset1280x720
    case "medium":
        return AVAssetExportPresetMediumQuality
    default:
        throw CompressionError.unsupportedPreset(label)
    }
}

do {
    let args = CommandLine.arguments
    guard args.count >= 3 else {
        throw CompressionError.invalidArguments
    }

    let inputURL = URL(fileURLWithPath: args[1])
    let outputURL = URL(fileURLWithPath: args[2])
    let requestedPreset = try presetName(for: args.count >= 4 ? args[3] : "540p")
    let asset = AVURLAsset(url: inputURL)

    guard let exporter = AVAssetExportSession(asset: asset, presetName: requestedPreset) else {
        throw CompressionError.cannotCreateExporter
    }

    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: outputURL.path) {
        try fileManager.removeItem(at: outputURL)
    }

    guard exporter.supportedFileTypes.contains(.mp4) else {
        throw CompressionError.unsupportedFileType
    }

    exporter.shouldOptimizeForNetworkUse = true
    if #available(macOS 15.0, *) {
        try await exporter.export(to: outputURL, as: .mp4)
    } else {
        exporter.outputURL = outputURL
        exporter.outputFileType = .mp4

        let semaphore = DispatchSemaphore(value: 0)
        exporter.exportAsynchronously {
            semaphore.signal()
        }
        semaphore.wait()

        switch exporter.status {
        case .completed:
            break
        case .failed:
            throw CompressionError.exportFailed(exporter.error?.localizedDescription ?? "Unknown AVFoundation error")
        case .cancelled:
            throw CompressionError.exportFailed("Export was cancelled")
        default:
            throw CompressionError.exportFailed("Unexpected exporter status: \(exporter.status.rawValue)")
        }
    }

    let inputSize = (try? fileManager.attributesOfItem(atPath: inputURL.path)[.size] as? NSNumber)?.int64Value ?? 0
    let outputSize = (try? fileManager.attributesOfItem(atPath: outputURL.path)[.size] as? NSNumber)?.int64Value ?? 0
    print("compressed \(inputSize) -> \(outputSize) bytes using \(requestedPreset)")
} catch {
    FileHandle.standardError.write(Data((error.localizedDescription + "\n").utf8))
    exit(1)
}
