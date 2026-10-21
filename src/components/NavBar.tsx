import './navbar.css';

export type ScreenId = 'home' | 'about';

type Props = {
  screen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
};

const ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'home', label: 'בית' },
  { id: 'about', label: 'אודות' },
];

export function NavBar({ screen, onNavigate }: Props) {
  return (
    <nav className="navbar" aria-label="ניווט ראשי">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="navbar__item"
          aria-current={screen === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
