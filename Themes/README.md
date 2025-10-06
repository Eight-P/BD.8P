## Themes

-   ### [T1-Theme](T1/)

<br/>

## Theme Customization

The theme.css file offers variables that can be changed for customization and can be edited with any text editor or the edit feature within BetterDiscord (when it's not broken).

<br/>

### Any changes made to the theme file directly are reset by theme file updates.

It is therefore recommended to copy & paste the variables you want to change into your Custom CSS/ QuickCSS.
<br/>

All variables are found within:

```css
:root {

}
```

They are prefixed by `--` and closed with a semicolon.

You can also find all available variables [here](https://github.com/Eight-P/BD.8P/blob/master/Themes/T1/src/components/mixins/_userVars.scss)

Copy the full lines into the root block, e.g.:

```css
:root {
  --disable-roleGradients: 1 ;
  --serverBar-IconSize: 90 ;
  --serverBar-Spacing: 14px ;
}
```

<br/>

Make sure you save your changes to make them apply.

It is usually worth checking the theme file after an update to see if any variables were changed or added.
