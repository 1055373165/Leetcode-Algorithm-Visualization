import React from 'react';
import {RestoreIpAddressesVisualizer, RestoreIpStep} from '../components/RestoreIpAddressesVisualizer';

const s = "25525511135";

const steps: RestoreIpStep[] = [];
const foundIPs: string[] = [];

const isValidSeg = (sub: string): boolean => {
    if (sub.length > 1 && sub[0] === '0') return false;
    const val = parseInt(sub, 10);
    return val >= 0 && val <= 255;
};

const backtrack = (start: number, segments: string[]) => {
    const seg = segments.length;
    const remaining = s.substring(start);

    if (seg === 4) {
        if (start === s.length) {
            const ip = segments.join('.');
            foundIPs.push(ip);
            steps.push({
                segments: [...segments],
                remaining: '',
                trying: '',
                status: 'found',
                foundIPs: [...foundIPs],
                reason: `Found valid IP: ${ip}`,
            });
        }
        return;
    }

    const rem = s.length - start;
    const minNeed = 4 - seg;
    const maxNeed = 3 * (4 - seg);
    if (rem < minNeed || rem > maxNeed) {
        steps.push({
            segments: [...segments],
            remaining,
            trying: '',
            status: 'prune',
            foundIPs: [...foundIPs],
            reason: `Prune: ${rem} chars left, need ${minNeed}-${maxNeed} for ${4-seg} segments`,
        });
        return;
    }

    for (let length = 1; length <= 3 && start + length <= s.length; length++) {
        const sub = s.substring(start, start + length);

        steps.push({
            segments: [...segments],
            remaining,
            trying: sub,
            status: 'try',
            foundIPs: [...foundIPs],
            reason: `Try "${sub}" as segment ${seg + 1}. Valid?`,
        });

        if (sub.length > 1 && sub[0] === '0') {
            steps.push({
                segments: [...segments],
                remaining,
                trying: sub,
                status: 'invalid',
                foundIPs: [...foundIPs],
                reason: `"${sub}" has leading zero. Break (longer also invalid).`,
            });
            break;
        }

        const val = parseInt(sub, 10);
        if (val > 255) {
            steps.push({
                segments: [...segments],
                remaining,
                trying: sub,
                status: 'invalid',
                foundIPs: [...foundIPs],
                reason: `"${sub}" = ${val} > 255. Break (longer also > 255).`,
            });
            break;
        }

        steps.push({
            segments: [...segments],
            remaining,
            trying: sub,
            status: 'valid',
            foundIPs: [...foundIPs],
            reason: `"${sub}" is valid (0-255, no leading zero). Recurse.`,
        });

        segments.push(sub);
        backtrack(start + length, segments);
        segments.pop();
    }
};

steps.push({
    segments: [],
    remaining: s,
    trying: '',
    status: 'try',
    foundIPs: [],
    reason: `Start: restore IP addresses from "${s}"`,
});

backtrack(0, []);

steps.push({
    segments: [],
    remaining: '',
    trying: '',
    status: 'found',
    foundIPs: [...foundIPs],
    reason: `Done! Found ${foundIPs.length} valid IPs.`,
});

export const RestoreIpAddressesComposition: React.FC = () => {
    return (
        <RestoreIpAddressesVisualizer
            steps={steps}
            title="93. Restore IP Addresses: Backtracking"
        />
    );
};
