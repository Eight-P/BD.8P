<div align="center">

  # CSS Snippets
</div>

<div align="center">

| <sub>All snippets are included with [T1](/Themes/T1/) by default.</sub> |
| -------- |

</div>
<br/>

> [!IMPORTANT]
> - Copy the imports to the **top** of your CustomCSS/QuickCSS to add the snippets. <br/>
> - Copy the variables **below** the imports to configure the snippets.

<br/>

### Compact channel search
<details open>
<summary> css </summary>

```css
/* Collapses the channel search box into an icon. */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/CompactChannelSearch.css);
```
</details open>

<br/>

### Hide chat input buttons
<details open>
<summary> css </summary>

```css
/* Removes buttons from chat input */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/HideChatButtons.css);
```
```css
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

### Hide user decorations and effects
<details open>
<summary> css </summary>

```css
/* Removes various user decorations */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/HideDecorations.css);
```
```css
/* Unless specified: 0 = Visible | 1 = Hidden */
:root {
  /* Profile pop-out/modal background effects */
  --hide-profileEffects: 0 ;

  /* User avatar decorations */
  --hide-avatarDecorations: 0 ;

  /* Nameplates
    0: Show all (default)
    1: Hide in member list
    2: Hide own in profile panel
    3: Hide all */
  --hide-nameplates: 0 ;

  /* Clan tags
    0: Show all (default)
    1: Hide in member list
    2: Hide all */
  --hide-clanTags: 0 ;

  /* Username holographic gradient & animation
    0: Show (default)
    1: Hide using color 1
    2: Hide using color 2 */
  --disable-roleGradients: 0 ;

  /* Super reaction animations */
  --hide-reactionAnimations: 0 ;
}
```
</details open>

<br/>

### Reduce chat message buttons and hover effect
<details open>
<summary> css </summary>

```css
/* Reduces the message buttons, hover effect and background for highlighted messages */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/ReduceMessageInteractions.css);
```
```css
:root {
  /* Reduce message buttons unless hovered
    0: Show all (default)
    1: Reduce until hovered
    2: Hidden */
  --reduce-messageBtns: 0 ;

  /* Hide just the emojis in message buttons
    0: Show all (default)
    1: Hide until hovered
    2: Hidden */
  --hide-messageBtnEmojis: 0 ;

  /* Hide message background hover
    0: Highlight on hover (default)
    1: Hide unless btns are hovered or expanded
    2: Never highlight */
  --hide-messageHover: 0 ;

  /* Reduce the highlight background for mentions and similar
    0: whole message (default)
    1: reduced */
  --reduce-highlightBackground: 0 ;
}
```
</details open>

<br/>

### Show URL of masked links
<details open>
<summary> css </summary>

```css
/* Shows the url next to a link that would otherwise be masked */
@import url(https://eight-p.github.io/BD.8P/Themes/Snippets/dist/UnmaskLinks.css);
```
```css
:root {
  /* Show the URL next to a masked link
    0: Masked (default)
    1: Show URL in messages (except embeds)
    2: Show URL everywhere */
  --unmask-links: 0 ;
}
```
</details open>
