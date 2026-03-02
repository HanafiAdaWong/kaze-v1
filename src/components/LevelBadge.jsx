import { calculateLevel } from '../services/userStats';

function LevelBadge({ xp, size = 'md' }) {
    const { level } = calculateLevel(xp || 0);

    // Color depends on level
    const getLevelColor = (l) => {
        if (l < 5) return 'lvl--bronze';
        if (l < 15) return 'lvl--silver';
        if (l < 30) return 'lvl--gold';
        if (l < 50) return 'lvl--platinum';
        if (l < 100) return 'lvl--diamond';
        return 'lvl--mythic';
    };

    const sizeClass = `lvl-badge--${size}`;

    return (
        <div className={`lvl-badge ${getLevelColor(level)} ${sizeClass}`} title={`Experience: ${xp} XP`}>
            <span className="lvl-badge__label">Lvl</span>
            <span className="lvl-badge__value">{level}</span>
        </div>
    );
}

export default LevelBadge;
