# babel-plugin-react-sketchapp-svg

A babel plugin that transforms SVG imports into [react-sketchapp](https://github.com/airbnb/react-sketchapp)-compatible primitives.

🚨 This is super BETA 🚨

This is my first dip into the babel plugin pool, so any help testing or developing would be *greatly* appreciated.

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": [
    "babel-plugin-react-sketchapp-svg"
  ]
}
```

#### Options
- *`verbose`* - Log level (`boolean`, default: `false`)
- *`defaultWidth`* - Default pixel width for SVG (`string` or `number`, default: `100%`)
- *`defaultHeight`* - Default pixel height for SVG (`string` or `number`, default: `100%`)
- ...inherited options from [babel-plugin-inline-react-svg](https://github.com/kesne/babel-plugin-inline-react-svg#options)

Example:

```json
{
  "plugins": [
    [
      "babel-plugin-react-sketchapp-svg",
      {
        "defaultWidth": 32,
        "defaultHeight": 32,
        "svgo": {
          "plugins": [
            {
              "removeAttrs": { "attrs": "(data-name)" }
            },
            {
              "cleanupIDs": true
            }
          ]
        }
      }
    ]
  ]
}

```
