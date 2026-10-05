const rnd = (n) => Math.abs(Math.sin(n * 127.1) * 43758.5453) % 1;

const ridge = (seed, base, amp, jag) => {
  let d = 'M-20 320 L-20 ' + base;
  for (let x = -20, i = 0; x <= 420; x += jag ? 26 : 20, i++) {
    const y = jag
      ? base - amp * rnd(seed + i)
      : base - (amp * (Math.sin(x * 0.014 + seed) + 0.6 * Math.sin(x * 0.037 + seed * 2))) / 1.6;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + ' L420 320Z';
};

const FX = {
  star: () => (
    <g>
      <circle r="28" fill="#fff3b0" opacity=".2" />
      <circle r="14" fill="#fff3b0" opacity=".35" />
      <path d="M0-20 3-3 20 0 3 3 0 20-3 3-20 0-3-3Z" fill="#fffbe0" />
    </g>
  ),
  cross: (c) => (
    <g fill={c}>
      <rect x="-3" y="-52" width="6" height="66" />
      <rect x="-21" y="-38" width="42" height="6" />
    </g>
  ),
  tomb: (c) => (
    <g>
      <path d="M-44 24Q-40-32 0-36Q40-32 44 24Z" fill={c} />
      <path d="M-13 24V-6Q0-18 13-6V24Z" fill="#0b0b12" />
      <circle cx="36" cy="12" r="15" fill="#8a8794" />
    </g>
  ),
  boat: (c) => (
    <g fill={c}>
      <path d="M-30 0H30L20 12H-20Z" />
      <rect x="-1.5" y="-40" width="3" height="40" />
      <path d="M3-38 26-6H3Z" opacity=".85" />
    </g>
  ),
  stable: (c) => (
    <g>
      <circle cy="6" r="34" fill="#ffc14d" opacity=".18" />
      <path d="M-34 22V-6L0-30 34-6V22Z" fill={c} />
      <rect x="-9" y="-2" width="18" height="24" fill="#ffc14d" />
    </g>
  ),
  palms: (c) => (
    <g stroke={c} fill="none" strokeWidth="3" strokeLinecap="round">
      <path d="M0 24Q4-10 0-40M0-40Q-16-44-26-30M0-40Q16-46 28-32M0-40Q-6-56-18-58M0-40Q8-56 20-56" />
      <path transform="translate(48 8)" d="M0 24Q-3-6 0-28M0-28Q-14-30-22-18M0-28Q14-32 24-20M0-28Q6-42 16-42" />
    </g>
  ),
  people: (c) => (
    <g fill={c}>
      {[-22, 0, 20].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i % 2 ? 2 : 0})`}>
          <circle cy="-22" r="5" />
          <path d="M-7 14Q-8-14 0-16Q8-14 7 14Z" />
        </g>
      ))}
    </g>
  ),
};

const SC = {
  dawn: { sky: ['#2b1b6b', '#ff8a5c', '#ffd98a'], orb: ['#fff1c2', 210, 150, 34], m: ['#6b4fa8', '#4a3585', '#2a1f55'], fx: [] },
  bethlehem: { sky: ['#0a0a2e', '#1d1b5c', '#4a3585'], stars: 1, m: ['#25246b', '#191850', '#0d0c30'], fx: [['star', 110, 70], ['stable', 270, 236, '#0a0a1f']] },
  field: { sky: ['#050520', '#141450', '#2b2a7a'], orb: ['#fff3b0', 320, 60, 18], stars: 1, m: ['#1e1e63', '#14144a', '#0a0a2c'], fx: [['star', 200, 80], ['people', 90, 240, '#05051a']] },
  magi: { sky: ['#0c0c3a', '#3a2a7a', '#d9a05a'], stars: 1, m: ['#7a5a6a', '#a3744f', '#5b3d2a'], fx: [['star', 300, 70], ['people', 110, 242, '#1c1208']] },
  desert: { sky: ['#2a2260', '#e0885a', '#ffd48a'], orb: ['#fff1c2', 90, 170, 30], m: ['#b98a6a', '#a3744f', '#6b4a30'], fx: [['people', 250, 244, '#1c1208']] },
  river: { sky: ['#3d7bd6', '#8ec5f0', '#e8f4ff'], orb: ['#fff8d6', 300, 80, 28], m: ['#7fa8c9', '#4f8a6a', '#2f6b4e'], water: 1, fx: [['people', 300, 250, '#173a2a']] },
  galilee: { sky: ['#f08a5d', '#f6c26b', '#fde7b0'], orb: ['#fff3c4', 120, 150, 30], m: ['#c98a6a', '#8d6b8f', '#4a4a7a'], water: 1, fx: [['boat', 250, 222, '#1c1a2e']] },
  cross: { sky: ['#1a0f2e', '#7a2e4f', '#f0784a'], orb: ['#ffb066', 200, 190, 44], m: ['#4a2545', '#2f1a3a', '#150c20'], fx: [['cross', 215, 208, '#0a0510']] },
  tomb: { sky: ['#5a3fa0', '#f59ab0', '#ffe6a0'], orb: ['#fffbe0', 200, 170, 40], rays: 1, m: ['#8a6bb8', '#5e4a8c', '#2f2557'], fx: [['tomb', 130, 236, '#231a3e']] },
  city: { sky: ['#4aa3e8', '#a8dcf5', '#fff4d0'], orb: ['#fff8d6', 80, 70, 26], m: ['#d9b48a', '#b98d62', '#8a6a44'], fx: [['palms', 90, 240, '#2f4a2a'], ['people', 290, 246, '#3a2a1a']] },
  supper: { sky: ['#1a1024', '#3a2040', '#7a4a3a'], orb: ['#ffcf80', 200, 130, 64], m: ['#3a2540', '#2a1a35', '#170e20'], fx: [['people', 200, 236, '#0d0812']] },
};

export default function Scene({ id }) {
  const s = SC[id] || SC.dawn;
  const seed = id.length * 3.7 + id.charCodeAt(0) * 0.13;
  const Layer = ({ d, children }) => (
    <svg className="ly" style={{ '--d': d }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {children}
    </svg>
  );

  return (
    <div className="scene">
      <div className="ly" style={{ '--d': 0.1, background: `linear-gradient(${s.sky[0]},${s.sky[1]} 55%,${s.sky[2]})` }} />
      <Layer d={0.3}>
        {s.stars && Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={rnd(i) * 400} cy={rnd(i + 50) * 170} r={0.6 + rnd(i + 90) * 1.3} fill="#fff" opacity={0.5 + rnd(i + 9) * 0.5} />
        ))}
        {s.rays && (
          <g transform={`translate(${s.orb[1]} ${s.orb[2]})`} opacity=".16" fill="#fff">
            {Array.from({ length: 9 }, (_, i) => <path key={i} d="M0 0-16-300 16-300Z" transform={`rotate(${-80 + i * 20})`} />)}
          </g>
        )}
        {s.orb && (
          <g>
            <circle cx={s.orb[1]} cy={s.orb[2]} r={s.orb[3] * 1.9} fill={s.orb[0]} opacity=".18" />
            <circle cx={s.orb[1]} cy={s.orb[2]} r={s.orb[3]} fill={s.orb[0]} />
          </g>
        )}
      </Layer>
      <Layer d={0.55}><path d={ridge(seed, 175, 95, true)} fill={s.m[0]} /></Layer>
      <Layer d={0.85}>
        <path d={ridge(seed + 2, 205, 50)} fill={s.m[1]} />
        {s.water && (
          <g>
            <rect y="212" width="400" height="100" fill={s.sky[1]} />
            {[226, 240, 254].map((y, i) => (
              <path key={y} d={`M${10 + i * 30} ${y}q20-5 40 0t40 0t40 0t40 0t40 0t40 0`} stroke="#fff" strokeWidth="1.6" fill="none" opacity=".5" />
            ))}
          </g>
        )}
      </Layer>
      <Layer d={1.2}>
        <path d={ridge(seed + 5, 268, 26)} fill={s.m[2]} />
        {s.fx.map(([k, x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>{FX[k](c)}</g>
        ))}
      </Layer>
    </div>
  );
}
