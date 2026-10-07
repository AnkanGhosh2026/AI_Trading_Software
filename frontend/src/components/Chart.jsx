import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function Chart({ candles, lines = [], height = 440 }) {
  const el = useRef();
  useEffect(() => {
    const ch = createChart(el.current, {
      height,
      layout: { background: { color: "#121820" }, textColor: "#8393a8" },
      grid: { vertLines: { color: "#1a2330" }, horzLines: { color: "#1a2330" } },
      rightPriceScale: { borderColor: "#243040" },
      timeScale: { borderColor: "#243040" },
    });
    if (candles)
      ch.addCandlestickSeries({ upColor: "#34d399", downColor: "#f87171", borderVisible: false, wickUpColor: "#34d399", wickDownColor: "#f87171" }).setData(candles);
    lines.forEach((l) =>
      ch.addLineSeries({ color: l.color, lineWidth: l.width || 1, lineStyle: l.dashed ? 2 : 0, priceLineVisible: false, lastValueVisible: false }).setData(l.data)
    );
    ch.timeScale().fitContent();
    const rs = () => ch.applyOptions({ width: el.current.clientWidth });
    rs();
    window.addEventListener("resize", rs);
    return () => { window.removeEventListener("resize", rs); ch.remove(); };
  }, [candles, lines, height]);
  return <div ref={el} />;
}
