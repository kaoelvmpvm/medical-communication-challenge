export function observeBodyMap(main) {
  const map = main.querySelector(".body-map");
  if (!map) return;
  const update = () => {
    const svg = map.querySelector(".body-connectors");
    if (!svg || matchMedia("(max-width: 700px)").matches) return;
    const bounds = map.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    const lines = [...map.querySelectorAll(".body-note")].map((note) => {
      const marker = map
        .querySelector(`[data-note="${note.id}"]`)
        .getBoundingClientRect();
      const card = note.getBoundingClientRect();
      const left = note.classList.contains("left");
      const x1 = (left ? card.right : card.left) - bounds.left;
      const y1 = card.top + card.height / 2 - bounds.top;
      const x2 = marker.left + marker.width / 2 - bounds.left;
      const y2 = marker.top + marker.height / 2 - bounds.top;
      const elbow = left ? x1 + 20 : x1 - 20;
      return `<polyline points="${x1},${y1} ${elbow},${y1} ${x2},${y2}"/>`;
    });
    svg.innerHTML = lines.join("");
  };
  const observer = new ResizeObserver(update);
  observer.observe(map);
  map.querySelectorAll(".body-note").forEach((note) => observer.observe(note));
  requestAnimationFrame(update);
  return observer;
}
