import { useRef, useEffect, useMemo, useState, useCallback } from "react";

function AreaChart({ data, xKey, yKeys, colors, height = 200, showGrid = true, showTooltip = true, className = "" }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(prev => Math.abs(prev - rect.width) > 1 ? rect.width : prev);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const margin = useMemo(() => ({ top: 20, right: 30, bottom: 40, left: 50 }), []);
  const innerWidth = useMemo(() => Math.max(0, (containerWidth || 800) - margin.left - margin.right), [containerWidth, margin]);
  const innerHeight = useMemo(() => height - margin.top - margin.bottom, [height, margin]);

  const allValues = useMemo(() => data.flatMap((d) => yKeys.map((k) => d[k])).filter((v) => v != null), [data, yKeys]);
  const yMin = 0;
  const yMax = useMemo(() => Math.max(...allValues, 1), [allValues]);

  const xScale = useCallback((index) => margin.left + (index / Math.max(data.length - 1, 1)) * innerWidth, [data.length, innerWidth, margin]);
  const yScale = useCallback((value) => margin.top + innerHeight - ((value - yMin) / (yMax - yMin)) * innerHeight, [innerHeight, margin, yMin, yMax]);

  const pathData = useMemo(() => {
    const width = containerWidth || 800;
    if (!width) return [];
    return yKeys.map((yKey, colorIndex) => {
      const points = data.map((d, i) => ({
        x: xScale(i),
        y: yScale(d[yKey] ?? 0),
        value: d[yKey],
        date: d[xKey],
      }));
      return { points, color: colors[colorIndex % colors.length], key: yKey };
    });
  }, [data, xKey, yKeys, colors, xScale, yScale, containerWidth]);

  const getPath = (points) => {
    if (points.length < 2) return "";
    const path = [`M${points[0].x},${points[0].y}`];
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX = (p0.x + p1.x) / 2;
      path.push(`C${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`);
    }
    return path.join(" ");
  };

  const getAreaPath = (points) => {
    if (points.length < 2) return "";
    const path = [`M${points[0].x},${margin.top + innerHeight}`];
    path.push(`L${points[0].x},${points[0].y}`);
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX = (p0.x + p1.x) / 2;
      path.push(`C${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`);
    }
    path.push(`L${points[points.length - 1].x},${margin.top + innerHeight}`);
    path.push("Z");
    return path.join(" ");
  };

  const handleMouseMove = (e) => {
    if (!showTooltip || !svgRef.current || !tooltipRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const index = Math.round(((mouseX - margin.left) / innerWidth) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    setHoverIndex(clampedIndex);
    tooltipRef.current.style.left = `${mouseX + 10}px`;
    tooltipRef.current.style.top = `${e.clientY - rect.top - 60}px`;
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  if (!data.length) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center ${className}`}>
        <div className="text-center text-[#14232B]/50">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const displayWidth = containerWidth || 800;

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: '100%' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${displayWidth} ${height}`}
        className="w-full h-[${height}px]"
        preserveAspectRatio="none"
      >
        {showGrid && (
          <g stroke="#E5E0D5" strokeWidth="0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={margin.left}
                y1={margin.top + ratio * innerHeight}
                x2={margin.left + innerWidth}
                y2={margin.top + ratio * innerHeight}
              />
            ))}
            {data.map((_, i) =>
              i % Math.ceil(data.length / 6) === 0 && (
                <line
                  key={i}
                  x1={xScale(i)}
                  y1={margin.top}
                  x2={xScale(i)}
                  y2={margin.top + innerHeight}
                />
              )
            )}
          </g>
        )}
        <g>
          {pathData.map(({ points, color, key: yKey }) => (
            <g key={yKey}>
              <path
                d={getAreaPath(points)}
                fill={color}
                fillOpacity={0.12}
                stroke="none"
              />
              <path
                d={getPath(points)}
                stroke={color}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {hoverIndex !== null && points[hoverIndex] && (
                <circle
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r={5}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </g>
          ))}
        </g>
        <g fontSize={11} fill="#9B9285" fontFamily="Inter, system-ui, sans-serif">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <text
              key={ratio}
              x={margin.left - 10}
              y={margin.top + ratio * innerHeight + 4}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {Math.round(yMax * (1 - ratio)).toLocaleString()}
            </text>
          ))}
          {data.map((d, i) =>
            i % Math.ceil(data.length / 6) === 0 && (
              <text
                key={i}
                x={xScale(i)}
                y={margin.top + innerHeight + 18}
                textAnchor="middle"
                dominantBaseline="hanging"
              >
                {typeof d[xKey] === "string" ? d[xKey].slice(5) : d[xKey]}
              </text>
            )
          )}
        </g>
      </svg>
      {showTooltip && hoverIndex !== null && data[hoverIndex] && (
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none z-10 px-3 py-2 bg-[#14232B] text-white text-xs rounded-lg shadow-lg whitespace-nowrap"
          style={{ opacity: hoverIndex !== null ? 1 : 0, transition: "opacity 0.15s" }}
        >
          <p className="font-medium mb-1">{data[hoverIndex][xKey]}</p>
          {pathData.map(({ points, color, key: yKey }) => (
            <p key={yKey} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {yKey}: {points[hoverIndex]?.value?.toLocaleString() ?? 0}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, xKey, yKey, color = "#129E9E", height = 200, showGrid = true, showValues = false, className = "" }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(prev => Math.abs(prev - rect.width) > 1 ? rect.width : prev);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const margin = useMemo(() => ({ top: 20, right: 20, bottom: 40, left: 50 }), []);
  const innerWidth = useMemo(() => Math.max(0, (containerWidth || 800) - margin.left - margin.right), [containerWidth, margin]);
  const innerHeight = useMemo(() => height - margin.top - margin.bottom, [height, margin]);

  const maxValue = useMemo(() => Math.max(...data.map((d) => d[yKey] ?? 0), 1), [data, yKey]);
  const barWidth = useMemo(() => innerWidth / data.length * 0.7, [innerWidth, data.length]);
  const barGap = useMemo(() => innerWidth / data.length * 0.3, [innerWidth, data.length]);

  const xScale = useCallback((index) => margin.left + index * (barWidth + barGap) + barGap / 2, [margin, barWidth, barGap]);
  const yScale = useCallback((value) => margin.top + innerHeight - (value / maxValue) * innerHeight, [margin, innerHeight, maxValue]);

  if (!data.length) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center ${className}`}>
        <div className="text-center text-[#14232B]/50">No data available</div>
      </div>
    );
  }

  const displayWidth = containerWidth || 800;

  return (
    <div ref={containerRef} className={className} style={{ width: '100%' }}>
      <svg ref={svgRef} viewBox={`0 0 ${displayWidth} ${height}`} className="w-full h-[${height}px]" preserveAspectRatio="none">
        {showGrid && (
          <g stroke="#E5E0D5" strokeWidth="0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={margin.left}
                y1={margin.top + ratio * innerHeight}
                x2={margin.left + innerWidth}
                y2={margin.top + ratio * innerHeight}
              />
            ))}
          </g>
        )}
        <g>
          {data.map((d, i) => {
            const value = d[yKey] ?? 0;
            const x = xScale(i);
            const y = yScale(value);
            const h = innerHeight - (y - margin.top);
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  fill={color}
                  rx={4}
                  ry={4}
                  className="transition-all duration-300 hover:opacity-80"
                />
                {showValues && value > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    dominantBaseline="bottom"
                    fontSize={11}
                    fill="#9B9285"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {value.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        <g fontSize={11} fill="#9B9285" fontFamily="Inter, system-ui, sans-serif">
          {data.map((d, i) =>
            i % Math.ceil(data.length / 8) === 0 && (
              <text
                key={i}
                x={xScale(i) + barWidth / 2}
                y={margin.top + innerHeight + 18}
                textAnchor="middle"
                dominantBaseline="hanging"
              >
                {typeof d[xKey] === "string" ? d[xKey].slice(5) : d[xKey]}
              </text>
            )
          )}
        </g>
      </svg>
    </div>
  );
}

function DonutChart({ data, labelKey, valueKey, colors, height = 200, showLegend = true, className = "" }) {
  const total = data.reduce((sum, d) => sum + (d[valueKey] ?? 0), 0);
  const radius = Math.min(height, 300) / 2 - 20;
  const strokeWidth = 24;

  if (!total) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] ${className}`}>
        <div className="text-center text-[#14232B]/50">No data available</div>
      </div>
    );
  }

  const segments = data.map((d, i) => {
    const value = d[valueKey] ?? 0;
    const percentage = value / total;
    const angle = percentage * 360;
    return { ...d, percentage, angle, color: colors[i % colors.length] };
  });

  let currentAngle = -90;
  const paths = segments.map((seg) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + seg.angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = radius * Math.cos(startRad);
    const y1 = radius * Math.sin(startRad);
    const x2 = radius * Math.cos(endRad);
    const y2 = radius * Math.sin(endRad);

    const largeArcFlag = seg.angle > 180 ? 1 : 0;

    return (
      <path
        key={seg[labelKey]}
        d={`M${x1},${y1} A${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`}
        stroke={seg.color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-500 hover:stroke-opacity-80"
      />
    );
  });

  return (
    <div className={`flex items-center justify-center gap-8 ${className}`}>
      <svg viewBox={`-${radius + strokeWidth} -${radius + strokeWidth} ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`} className="w-full h-auto max-w-[200px]">
        {paths}
        <circle
          cx={0}
          cy={0}
          r={radius - strokeWidth / 2}
          fill="white"
        />
      </svg>
      {showLegend && (
        <div className="flex flex-col gap-2">
          {segments.map((seg) => (
            <div key={seg[labelKey]} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-[#14232B]/70">{seg[labelKey]}</span>
              <span className="text-sm font-semibold text-[#14232B] ml-auto">
                {seg[valueKey]?.toLocaleString()} ({(seg.percentage * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { AreaChart, BarChart, DonutChart };