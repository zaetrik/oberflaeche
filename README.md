# Oberfläche

`Oberfläche` is a simple zero-dependency library that let's you build UIs with `JSX` in `TypeScript` or `JavaScript`. It also provides you with the possibility to use state, effects (experimental & clean up not fully working yet) and the option to manually refresh components. Furthermore it has a simple diffing algorithm for the rendering.

Important to know is that the state is always global, which means you can, if you decide to, hook into the state of any other component and control or read it. The same goes for manual refreshing of components. These component utilities, or also called component context, are always provided via the second component function argument.

_Attention! This is just a little side project and should not be used for anything important!_

## Components

When working with `Oberfläche` we are differentiating between two types of components, `stateless/non-reactive` and `stateful/reactive`. `Stateful/Reactive` components have a few requirements that have to be obeyed.

### `Stateless/Non-reactive Component`

```.tsx
type HalloProps = { name: string; }
const Hallo: Component<HalloProps> = ({ name }) => {
    return <h1>{name}</h1>
}
```

### `Stateful/Reactive Component`

```.tsx
const Hallo: Component = ({}, ctx) => {
    const oberflaecheId = "my-globally-unique-oberflaeche-id"
    const [state, setState] = ctx.state(oberflaecheId, { count: 0, name: generateName })

    const generateName = () => {
        setState({ count: state().count + 1, name: aiBasedNameGenerator() })
    }

    return (
        <div oberflaecheId={oberflaecheId}>
            <h1>{name}</h1>
            <p>We had {state().count} names so far</p>
            <button oberflaecheId={`${oberflaecheId}-button`} onClick={generateName}>
                Show me a name
            </button>
        </div>
    )
}
```

Stateful components or components that are reactive must provide a globally unique `oberflaecheId` for each instance. Every component that uses any method from the context is a `stateful/reactive` component. For example, if you render a list of components, which are using state or something else that is reactive internally, each item will need a globally unique `oberflaecheId` that will stay the same during the time the component will be rendered and run. This means you cannot use random numbers or such as an `oberflaecheId`.
Additionally each element with an event listener needs a unique `oberflaecheId` as well.

The `oberflaecheId` needs to be applied to the outer most container of a component, if you'd like to use the context. If you'd like to use event listeners for an element, then the `oberflaecheId` should be applied to the element itself. Your event handlers should also work, if you don't add a unique `oberflaecheId` to the element, but it will be less performant and could cause some unintended behavior.

You can always pass the `oberflaecheId` as a prop to any of your function components and `Oberfläche` will automatically pass it down and apply it to the outer most container. The only exception here is that you cannot do this on the initial parent component you will run `.render` on.

### Example

```.tsx

// Generic button that will be used in multiple different components.
type ButtonProps = { text: string; onClick: () => void; }
const Button: Component<ButtonProps> = (props) => {
  const { text, onClick } = props

  return <button onClick={onClick}>{text}</button>
}

type Product = { id: string; name: string; price: number; }
type ShopItemsProps = { products: Product[] }
const ShopItems: Component<ShopItemsProps> = (props, ctx) => {
    const oberflaecheId = "my-globally-unique-oberflaeche-id"
    const [cart, updateCart] = ctx.state<string[]>(oberflaecheId, { productIds: [] })

    const addToCart = (id: string) => {
        updateCart({ cart: [...cart().productIds, id] })
    }

    // Adding a unique `oberflaecheId` for every instance of the `Button` that will be rendered.
    return (
        <div>
            <h1>Shop Items</h1>
            <p>You have {cart().productIds.length} items in the bag</p>
            <ul>
              {products.map(product => {
                return (
                  <li>
                    <h3>{product.name}</h3>
                    <p>{prodcut.price}</p>
                    {
                      !cart().productIds.includes(product.id) &&
                      <Button oberflaecheId={`${oberflaecheId}-add-${product.id}-button`} text="Add to cart" onClick={() => addToCart(product.id)} />
                    }
                  </li>
                )
              })}
            </ul>
        </div>
    )
}
```

## Component Context

```ts
type ComponentContext = {
  refresh: (oberflaecheId: string, options?: { diffing?: boolean }) => void;
  refreshOther: (component: Component, props: Props, oberflaecheId: string, options?: { diffing?: boolean }) => void;
  state: <STATE>(
    oberflaecheId: string,
    initialState?: STATE,
    options?: { diffing?: boolean; autoRefresh?: boolean }
  ) => [getState: () => STATE, setState: (newState: STATE) => void];
  stateOther: <STATE>(
    component: Component,
    props: Props,
    oberflaecheId: string,
    initialState?: STATE,
    options?: { diffing?: boolean; autoRefresh?: boolean }
  ) => [getState: () => STATE, setState: (newState: STATE) => void];
  globalState: <STATE>(oberflaecheId?: string) => STATE | Map<string, any>;
  effect: (effect: () => () => void, dependencies: any[], oberflaecheId: string, effectId: string) => void;
};
```

## Installation

```bash

$ npm i -s oberflaeche

```

### Example `Webpack` + `Babel` + `TypeScript` setup:

```
$ npm i -D @babel/cli @babel/plugin-transform-react-jsx @babel/preset-env @babel/preset-typescript typescript webpack webpack-cli webpack-dev-server @babel/core babel-loader css-loader mini-css-extract-plugin
```

`.babelrc`

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-typescript"],
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "runtime": "automatic",
        "importSource": "oberflaeche/dist"
      }
    ]
  ]
}
```

`tsconfig.json` with the following added to your config:

```
"jsx": "react-jsx",
"jsxImportSource": "oberflaeche",
```

`webpack.config.js`

```js
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const prod = process.argv.includes("-p");

module.exports = {
  devtool: prod ? "source-map" : "inline-source-map",
  entry: "./src/App.tsx",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "js/bundle.js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx"],
  },
  devServer: {
    contentBase: path.join(__dirname, "public"),
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
        ],
      },
      {
        // Include ts(x) and js(x) files.
        test: /\.(ts|js)x?$/,
        exclude: [/node_modules/],
        loader: "babel-loader",
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/bundle.css",
    }),
  ],
};
```

Add these scripts to your `package.json`

```json
"scripts": {
    "start:dev": "webpack-dev-server -p --open",
    "build": "webpack --mode production"
},
```

Additionally you'll need a `public` folder with a basic HTML file like this

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Oberfläche</title>
    <link rel="stylesheet" href="css/bundle.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="js/bundle.js"></script>
  </body>
</html>
```
