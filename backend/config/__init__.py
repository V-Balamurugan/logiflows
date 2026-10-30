"""
LogiFlows configuration package.
Includes Python 3.14+ compatibility patch for Django BaseContext.__copy__.
"""
import sys

if sys.version_info >= (3, 14):
    try:
        import django.template.context

        def _safe_context_copy(self):
            dup = object.__new__(self.__class__)
            dup.__dict__.update(self.__dict__)
            dup.dicts = self.dicts[:]
            return dup

        django.template.context.BaseContext.__copy__ = _safe_context_copy
    except Exception:
        pass
