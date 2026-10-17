#!/usr/bin/env python3
"""Run bounded TLC checks and demand actual invariant failures from mutants."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jar', type=Path, required=True, help='Official tla2tools.jar')
    parser.add_argument('--java', default='java')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    jar = args.jar.resolve(strict=True)
    base = Path(__file__).resolve().parent
    checks = [
        ('DeviceSync', 'DeviceSync', None),
        ('ProfileBinding', 'ProfileBinding', None),
        ('UnsafeApply', 'DeviceSync', 'FreshWriteAuthority'),
        ('UnsafeReceipt', 'DeviceSync', 'AppliedMeansLatest'),
        ('UnsafePair', 'DeviceSync', 'PresenceIsNotTrust'),
        ('UnsafeProfileBinding', 'ProfileBinding', 'NoCrossProfileWrite'),
    ]
    report = {
        'tool_sha256': hashlib.sha256(jar.read_bytes()).hexdigest(),
        'java_version': subprocess.run([args.java, '-version'], text=True,
                                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       check=True).stdout.splitlines()[0],
        'kind': 'bounded model checks; no implementation refinement or crypto proof',
        'checks': [],
    }
    with tempfile.TemporaryDirectory(prefix='filtertube-tlc-') as work:
        for config, module, invariant in checks:
            result = subprocess.run([
                args.java, '-XX:+UseParallelGC', '-cp', str(jar), 'tlc2.TLC',
                '-workers', '2', '-seed', '20261017', '-fp', '0',
                '-metadir', str(Path(work) / config), '-config', config + '.cfg',
                module + '.tla',
            ], cwd=base, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                timeout=120)
            output = result.stdout
            if 'tlc_version' not in report:
                report['tlc_version'] = output.splitlines()[0]
            expected = (f'Error: Invariant {invariant} is violated.' if invariant
                        else 'Model checking completed. No error has been found.')
            passed = expected in output and result.returncode == (12 if invariant else 0)
            counts = re.search(r'(\d+) states generated, (\d+) distinct states found', output)
            depth = re.search(r'depth of the complete state graph search is (\d+)', output)
            steps = re.findall(r'State \d+: <([^>]+)>', output)
            record = {'config': config, 'accepted': passed,
                      'expected_invariant_failure': invariant,
                      'exit_code': result.returncode,
                      'generated': int(counts[1]) if counts else None,
                      'distinct': int(counts[2]) if counts else None,
                      'depth': int(depth[1]) if depth else None}
            if steps:
                record['counterexample_actions'] = steps
            report['checks'].append(record)
            print(json.dumps(record))
            if not passed:
                print(output)
                raise SystemExit(1)
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
