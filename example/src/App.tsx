import { Component, render } from "oberflaeche";
import Shop from "./components/Shop";

const App: Component = () => {
  return <Shop />;
};

render(<App />, document.getElementById("app"));
