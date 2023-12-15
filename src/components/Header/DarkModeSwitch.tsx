import useDarkSide from '../../hooks/useDarkSide';
import './switch.css';

export default function DarkModeSwitch() {
  const [theme, switchSheme] = useDarkSide();
  return (
    <div className="mode-trigger">
      <input type="checkbox" value={theme} onClick={switchSheme} className="trigger" />
    </div>
  );
}
