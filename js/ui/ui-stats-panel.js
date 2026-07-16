// ---- item 6: لوحة إحصائيات (top-10 ارتباطًا، توزيع الفئات، مضاف يدويًا مقابل أصلي) ----
function computeStatsSnapshot(){
  const byConnRaw = [...nodes].sort((a,b)=> b.connections.length - a.connections.length).slice(0,10);
  const betweenness = computeBetweennessCentrality();
  const byBetweenness = [...nodes].sort((a,b)=> (betweenness.get(b.id)||0) - (betweenness.get(a.id)||0)).slice(0,10)
    .map(n=> ({ node:n, score: betweenness.get(n.id)||0 }));
  const catDist = {};
  nodes.forEach(n=>{ catDist[n.category] = (catDist[n.category]||0) + 1; });
  const addedCount = nodes.filter(n=>n.added).length;
  return { byConnRaw, byBetweenness, catDist, addedCount, originalCount: nodes.length - addedCount, total: nodes.length };
}

