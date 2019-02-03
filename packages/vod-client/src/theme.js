import React, { Component, Fragment } from 'react';
import { ThemeProvider as Provider, createGlobalStyle } from 'styled-components';
import { loadTheme, createTheme } from 'office-ui-fabric-react/lib/Styling';
import styledSanitize from 'styled-sanitize';

const lightTheme = createTheme({
  palette: {
    themePrimary: '#ff0000',
    themeLighterAlt: '#fff5f5',
    themeLighter: '#ffd6d6',
    themeLight: '#ffb3b3',
    themeTertiary: '#ff6666',
    themeSecondary: '#ff1f1f',
    themeDarkAlt: '#e60000',
    themeDark: '#c20000',
    themeDarker: '#8f0000',
    neutralLighterAlt: '#f8f8f8',
    neutralLighter: '#f4f4f4',
    neutralLight: '#eaeaea',
    neutralQuaternaryAlt: '#dadada',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c8c8',
    neutralTertiary: '#595959',
    neutralSecondary: '#373737',
    neutralPrimaryAlt: '#2f2f2f',
    neutralPrimary: '#000000',
    neutralDark: '#151515',
    black: '#0b0b0b',
    white: '#ffffff',
    bodyBackground: '#ffffff',
    bodyText: '#000000',
  },
});
lightTheme.name = 'light';

const darkTheme = createTheme({
  palette: {
    themePrimary: '#eb0000',
    themeLighterAlt: '#090000',
    themeLighter: '#260000',
    themeLight: '#460000',
    themeTertiary: '#8d0000',
    themeSecondary: '#ce0000',
    themeDarkAlt: '#ed1818',
    themeDark: '#ef3939',
    themeDarker: '#f46b6b',
    neutralLighterAlt: '#1c1c1c',
    neutralLighter: '#252525',
    neutralLight: '#343434',
    neutralQuaternaryAlt: '#3d3d3d',
    neutralQuaternary: '#454545',
    neutralTertiaryAlt: '#656565',
    neutralTertiary: '#c8c8c8',
    neutralSecondary: '#d0d0d0',
    neutralPrimaryAlt: '#dadada',
    neutralPrimary: '#ffffff',
    neutralDark: '#f4f4f4',
    black: '#f8f8f8',
    white: '#121212',
    bodyBackground: '#121212',
    bodyText: '#ffffff',
  },
});
darkTheme.name = 'dark';

const initialTheme = localStorage.getItem('theme') === 'dark' ? darkTheme : lightTheme;
// const initialTheme = darkTheme;

console.log(lightTheme);
console.log(darkTheme);

const GlobalThemeStyle = createGlobalStyle`
  ${styledSanitize}

  html {
    background-color: ${({ theme }) => theme.palette.bodyBackground};
  }

  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.medium.fontFamily};
    color: ${({ theme }) => theme.palette.bodyText};
  }

  a {
    text-decoration: inherit;
    color: inherit;
    outline: inherit;
  }

  .recharts-wrapper {
    direction: ltr;
  }

  .ms-Button--primary {
    &,
    &:hover,
    &:active {
      color: #fff;
    }
  }

  .ms-Pivot--tabs .ms-Pivot-link.is-selected {
    color: #fff;
    font-weight: normal;
  }

  .ms-fontWeight-light {
    font-weight: 100;
  }

  .ms-fontWeight-semilight {
    font-weight: 300;
  }

  .ms-fontWeight-regular {
    font-weight: 400;
  }

  .ms-fontWeight-semibold {
    font-weight: 600;
  }

  .ms-fontSize-mi {
    font-size: 10px;
  }

  .ms-fontSize-xs {
    font-size: 11px;
  }

  .ms-fontSize-s {
    font-size: 12px;
  }

  .ms-fontSize-sPlus {
    font-size: 13px;
  }

  .ms-fontSize-m {
    font-size: 14px;
  }

  .ms-fontSize-mPlus {
    font-size: 15px;
  }

  .ms-fontSize-l {
    font-size: 17px;
  }

  .ms-fontSize-xl {
    font-size: 21px;
  }

  .ms-fontSize-xxl {
    font-size: 28px;
  }

  .ms-fontSize-su {
    font-size: 42px;
  }

  .ms-font-mi {
    font-size: 10px;
    font-weight: 300;
  }

  .ms-font-xs {
    font-size: 11px;
    font-weight: 400;
  }

  .ms-font-s {
    font-size: 12px;
    font-weight: 400;
  }

  .ms-font-s-plus {
    font-size: 13px;
    font-weight: 400;
  }

  .ms-font-m {
    font-size: 14px;
    font-weight: 400;
  }

  .ms-font-m-plus {
    font-size: 15px;
    font-weight: 400;
  }

  .ms-font-l {
    font-size: 17px;
    font-weight: 300;
  }

  .ms-font-xl {
    font-size: 21px;
    font-weight: 100;
  }

  .ms-font-xxl {
    font-size: 28px;
    font-weight: 100;
  }

  .ms-font-su {
    font-size: 42px;
    font-weight: 100;
  }

  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: ${({ theme }) => theme.palette.neutralLight};
  }

  ::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    background-color: ${({ theme }) => theme.palette.themeDarkAlt};
  }
`;

export const ThemeContext = React.createContext({
  theme: initialTheme,
  toggleTheme: () => {},
});

export default class ThemeProvider extends Component {
  constructor() {
    super();
    loadTheme(initialTheme);
    this.state = { theme: initialTheme };
  }

  loadTheme(theme) {
    theme.breakpoints = ['576px', '768px', '992px', '1200px'];
    this.setState({ theme });
    loadTheme(theme);
  }

  createTheme(theme) {
    return createTheme(theme);
  }

  toggleTheme = () => {
    const newTheme = this.state.theme === lightTheme ? darkTheme : lightTheme;
    localStorage.setItem('theme', this.state.theme === lightTheme ? 'dark' : 'light');
    this.loadTheme(newTheme);
  };

  render() {
    return (
      <Provider theme={this.state.theme}>
        <ThemeContext.Provider
          value={{
            theme: this.state.theme,
            toggleTheme: this.toggleTheme,
          }}
        >
          <Fragment>
            <GlobalThemeStyle />
            {this.props.children}
          </Fragment>
        </ThemeContext.Provider>
      </Provider>
    );
  }
}
