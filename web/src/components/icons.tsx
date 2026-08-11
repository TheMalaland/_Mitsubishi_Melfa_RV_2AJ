// Small CSS-shape icons that inherit currentColor, instead of emoji.
export function PlayIcon() {
  return <span className="icon icon-play" aria-hidden="true" />;
}

export function PauseIcon() {
  return (
    <span className="icon icon-pause" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

export function StopIcon() {
  return <span className="icon icon-stop" aria-hidden="true" />;
}
