import React from 'react';
import { calculateViolationSeverity } from '../utils/helpers';

const SEVERITY = {
  none:   'bg-green-500/10 text-green-400',
  low:    'bg-amber-500/10 text-amber-400',
  medium: 'bg-orange-500/10 text-orange-400',
  high:   'bg-red-500/10 text-red-400 animate-[pulseBadge_1.5s_infinite]',
};

function ViolationBadge({ count = 0, label }) {
  const severity = calculateViolationSeverity(count);
  return (
    <span
      className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5
                  rounded-full text-xs font-bold ${SEVERITY[severity]}`}
      title={label ? `${label}: ${count}` : `${count} violations`}
    >
      {count}
    </span>
  );
}

export default ViolationBadge;
