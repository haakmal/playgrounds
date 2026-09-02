const TARGET_COUNT = 5;

function randomValue(max) {
    return Math.floor(Math.random() * max);
}

export function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = randomValue(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function scoreCandidate(candidate, selected) {
    const categoryCount = selected.filter(item => item.category === candidate.category).length;
    const territoryCount = selected.filter(item => item.territory === candidate.territory).length;
    const deviceCount = selected.filter(item => item.device === candidate.device).length;
    const classCount = selected.filter(item => item.classification === candidate.classification).length;

    let score = Math.random() * 10;
    score -= categoryCount * 18;
    score -= territoryCount * 24;
    score -= deviceCount >= 3 ? 14 : 0;
    score -= candidate.classification === 'dark-pattern' && classCount >= 2 ? 60 : 0;
    score += selected.some(item => item.device !== candidate.device) ? 4 : 0;
    score += selected.some(item => item.classification !== candidate.classification) ? 3 : 0;
    return score;
}

export function chooseSpecimens(specimens, count = TARGET_COUNT) {
    const selected = [];
    const candidates = [...specimens];
    const hasMobile = candidates.some(item => item.device === 'mobile');
    const hasNonMobile = candidates.some(item => item.device !== 'mobile');

    if (hasMobile) {
        const mobile = shuffle(candidates.filter(item => item.device === 'mobile'));
        selected.push(mobile[0]);
    }

    if (hasNonMobile && selected.length < count) {
        const nonMobile = shuffle(candidates.filter(item => item.device !== 'mobile'));
        const candidate = nonMobile.find(item => !selected.some(existing => existing.id === item.id));
        if (candidate) selected.push(candidate);
    }

    while (selected.length < count) {
        const remaining = candidates.filter(item => !selected.some(existing => existing.id === item.id));
        if (!remaining.length) break;

        remaining.sort((a, b) => scoreCandidate(b, selected) - scoreCandidate(a, selected));
        selected.push(remaining[0]);
    }

    return shuffle(selected);
}

export function createCaseId() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let value = '';
    for (let i = 0; i < 6; i += 1) value += alphabet[randomValue(alphabet.length)];
    return value;
}
