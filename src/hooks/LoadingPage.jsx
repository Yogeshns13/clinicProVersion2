const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700&display=swap');

  .lp-overlay {
    position: fixed;
    top: 0;
    bottom: 30px;
    right: 0;
    left: var(--lp-sidebar, 240px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    background: var(--lp-bg, #ffffff);
  }

  .lp-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* Heart wrapper */
  .lp-heart-wrap {
    position: relative;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
  }

  .lp-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2.5px solid rgba(14,165,233,0.3);
    animation: lpRingOut 1.6s ease-out infinite;
  }
  .lp-ring-2 { animation-delay: 0.8s; }

  @keyframes lpRingOut {
    0%   { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(2.2); opacity: 0;   }
  }

  .lp-heart-svg {
    width: 38px;
    height: 34px;
    position: relative;
    z-index: 1;
    animation: lpHeartBeat 1.6s ease-in-out infinite;
  }

  @keyframes lpHeartBeat {
    0%,100% { transform: scale(1);    }
    14%     { transform: scale(1.22); }
    28%     { transform: scale(1);    }
    42%     { transform: scale(1.12); }
    70%     { transform: scale(1);    }
  }

  /* ECG strip */
  .lp-ecg-outer {
    width: 340px;
    height: 90px;
    overflow: hidden;
    position: relative;
  }

  .lp-ecg-svg {
    width: 680px;
    height: 90px;
    animation: lpEcgScroll 1.6s linear infinite;
  }

  @keyframes lpEcgScroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-340px); }
  }

  .lp-ecg-outer::before,
  .lp-ecg-outer::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    width: 56px;
    z-index: 2;
    pointer-events: none;
  }
  .lp-ecg-outer::before { left:0;  background: linear-gradient(90deg,  var(--lp-bg,#ffffff), transparent); }
  .lp-ecg-outer::after  { right:0; background: linear-gradient(270deg, var(--lp-bg,#ffffff), transparent); }
`;

const C = [
  [0,45],[18,45],
  [24,38],[30,45],[36,45],
  [40,48],[46,4],[52,82],[58,32],[64,45],
  [70,45],[80,52],[92,45],
  [112,45],[130,45],[148,45],
  [154,38],[160,45],[166,45],
  [170,48],[176,4],[182,82],[188,32],[194,45],
  [200,45],[210,52],[222,45],
  [242,45],[260,45],[278,45],
  [284,38],[290,45],[296,45],
  [300,48],[306,4],[312,82],[318,32],[324,45],
  [330,45],[340,52],[340,45],
];

const pts = [
  ...C.map(([x,y]) => `${x},${y}`),
  ...C.map(([x,y]) => `${x+340},${y}`),
].join(" ");

export default function LoadingPage({ bg = "#ffffff", sidebarWidth = "240px" }) {
  return (
    <>
      <style>{css}</style>
      <div
        className="lp-overlay"
        style={{ "--lp-bg": bg, "--lp-sidebar": sidebarWidth }}
      >
        <div className="lp-center">

          {/* Beating heart */}
          <div className="lp-heart-wrap">
            <div className="lp-ring" />
            <div className="lp-ring lp-ring-2" />
            <svg
              className="lp-heart-svg"
              viewBox="0 0 38 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 31C19 31 3 21 3 11C3 6.58 6.58 3 11 3C14.1 3 16.82 4.74 19 7C21.18 4.74 23.9 3 27 3C31.42 3 35 6.58 35 11C35 21 19 31 19 31Z"
                fill="#0ea5e9"
                stroke="#0ea5e9"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* ECG strip */}
          <div className="lp-ecg-outer">
            <svg
              className="lp-ecg-svg"
              viewBox="0 0 680 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline
                points={pts}
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

        </div>
      </div>
    </>
  );
}