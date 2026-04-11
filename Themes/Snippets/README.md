<div align="center">

  # CSS Snippets
</div>

<br/>

> All snippets are included with [T1](/Themes/T1/) by default.

Copy & Paste the individual code snippets into your CustomCSS / QuickCSS.

- make sure to save and apply any changes.

<br/>

### HideChatButtons
<details open>
<summary> css </summary>

```css
/* Removes buttons from chat input */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/HideChatButtons.css);

/* 0 = Visible | 1 = Hidden */
:root {
  --hide-chatBtn-nitro: 1 ;
  --hide-chatBtn-gif: 0 ;
  --hide-chatBtn-sticker: 0 ;
  --hide-chatBtn-emoji: 0 ;
  --hide-chatBtn-apps: 0 ;
}
```
</details open>

<br/>

### HideDecorations
<details open>
<summary> css </summary>

```css
/* Removes various user decorations */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/HideDecorations.css);

/* Effects & Decorations: 0 = Visible | 1 = Hidden */
:root {
  /* Profile pop-out/modal background effects */
  --hide-profileEffects: 1 ;

  /* User avatar decorations */
  --hide-avatarDecorations: 1 ;

  /* Nameplates
    0: Show all (default)
    1: Hide in member list
    2: Hide own in profile panel
    3: Hide all */
  --hide-nameplates: 3 ;

  /* Clan tags
    0: Show all (default)
    1: Hide in member list
    2: Hide all */
  --hide-clanTags: 1 ;

  /* Username holographic gradient & animation */
  --disable-roleGradients: 1 ;

  /* Super reaction animations */
  --hide-reactionAnimations: 1 ;
}
```
</details open>

<br/>

### ReduceMessageInteractions
<details open>
<summary> css </summary>

```css
/* Reduces the message buttons and/or background highlight on hover */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/ReduceMessageButtons.css);

:root {
  /* Reduce message buttons unless hovered
    0: Show all (default)
    1: Reduce until hovered */
  --reduce-messageBtns: 0 ;

  /* Hide emojis in message buttons
    0: Show all (default)
    1: Hide until hovered
    2: Always hidden */
  --hide-messageBtnEmojis: 1 ;

  /* Removes the background highlight when hovering a message
    0: Highlight on hover (default)
    1: Hide until btns are hovered or expanded
    2: Never highlight */
  --hide-messageHover: 1 ;
}
```
</details open>

<br/>

### UnmaskLinks
<details open>
<summary> css </summary>

```css
/* Shows the url next to a link that would otherwise be masked */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/UnmaskLinks.css);

:root {
  /* Show the URL next to a masked link
    0: Masked (default)
    1: Show URL */
  --unmask-links: 1 ;
}
```
</details open>
