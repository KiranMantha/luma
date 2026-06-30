import './Header.css';

type HeaderProps = {
  general: {
    brandName: string;
  };
  menu1: MainMenuNav;
  menu2: MainMenuNav;
};

type MainMenuNav = {
  menuName: string;
  subMenu: Array<{
    menuName: string;
    url: string;
    iconName: string;
  }>;
};

export const Header = (props: HeaderProps) => {
  const { general, menu1, menu2 } = props;
  const menus = [menu1, menu2];

  return (
    <header>
      <p className="brandName">{general.brandName}</p>
      <ul>
        {menus.map((menu) => (
          <li key={menu.menuName}>{menu.menuName}</li>
        ))}
      </ul>
    </header>
  );
};
