## Themes

-   ### [T1-Theme](T1/)

<br/>

## Theme Customization

The theme.css file offers variables that can be changed for customization and can be edited with any text editor or the edit feature within BetterDiscord.

Make sure you save your changes to make them apply.

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

Copy the full lines into the root block, e.g.:

```css
:root {
  --show-serverboost-stats: 1 ;
  --show-sticker-btn: 0 ;
}
```

<br/>

It is usually worth checking the theme file after an update to see if any variables were changed or added.
