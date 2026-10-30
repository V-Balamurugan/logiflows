#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

    # Automatically resolve project virtualenv if running with global python without manual activation
    base_dir = Path(__file__).resolve().parent
    for candidate in [base_dir.parent / '.venv', base_dir / '.venv']:
        win_site_packages = candidate / 'Lib' / 'site-packages'
        posix_site_packages = candidate / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages'
        if win_site_packages.is_dir() and str(win_site_packages) not in sys.path:
            sys.path.insert(0, str(win_site_packages))
            break
        elif posix_site_packages.is_dir() and str(posix_site_packages) not in sys.path:
            sys.path.insert(0, str(posix_site_packages))
            break

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

