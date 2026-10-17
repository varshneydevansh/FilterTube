#!/usr/bin/env python3
"""Check the bounded issue race contracts and their unsafe counterexamples."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jar', type=Path, required=True)
    parser.add_argument('--java', default='java')
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    jar = args.jar.resolve(strict=True)
    base = Path(__file__).resolve().parent
    report = {
        'kind': 'bounded abstract safety checks; not implementation refinement',
        'tool_sha256': hashlib.sha256(jar.read_bytes()).hexdigest(),
        'model_sha256': hashlib.sha256((base / 'IssueSafety.tla').read_bytes()).hexdigest(),
        'java_version': subprocess.run([args.java, '-version'], check=True, text=True,
                                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout.splitlines()[0],
        'checks': []
    }
    with tempfile.TemporaryDirectory(prefix='filtertube-issue-tlc-') as work:
        for config, invariant in [('Safe', None), ('UnsafeInit', 'FreshInitialization'),
                                  ('UnsafeExport', 'FreshExportReview')]:
            result = subprocess.run([
                args.java, '-cp', str(jar), 'tlc2.TLC', '-workers', '2',
                '-seed', '20261017', '-metadir', str(Path(work) / config),
                '-config', config + '.cfg', 'IssueSafety.tla'
            ], cwd=base, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=45)
            output = result.stdout
            report.setdefault('tlc_version', output.splitlines()[0])
            expected = (f'Invariant {invariant} is violated.' if invariant else
                        'Model checking completed. No error has been found.')
            accepted = expected in output and result.returncode == (12 if invariant else 0)
            counts = re.search(r'(\d+) states generated, (\d+) distinct states found', output)
            record = {'configuration': config, 'accepted': accepted,
                      'expected_invariant_failure': invariant, 'exit_code': result.returncode,
                      'generated': int(counts[1]) if counts else None,
                      'distinct': int(counts[2]) if counts else None,
                      'counterexample_actions': re.findall(r'State \d+: <([^>]+)>', output)}
            report['checks'].append(record)
            print(json.dumps(record))
            if not accepted:
                print(output)
                raise SystemExit(1)
    args.report.write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
