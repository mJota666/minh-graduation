# Minh's graduation invitation

A responsive, personalized graduation invitation for November 26, 2026. It is a buildless static site, so it can be hosted on GitHub Pages and easily handle the expected guest list.

## Personal links

Add a guest name through any of these equivalent query parameters:

```text
https://your-domain.example/?guest=An%20Nguyen
https://your-domain.example/?name=An%20Nguyen
https://your-domain.example/?to=An%20Nguyen
```

For the built-in bulk link generator, open the invitation with `?admin=1`, enter one name per line, and select **Generate links**. The generator runs only in the browser.

## Edit event details

- Ceremony date/time and fallback guest: `CONFIG` at the top of `app.js`
- Visible event copy, address, and map link: `index.html`
- Route simulation and visual design: `styles.css` and the map section of `index.html`

The researched inter-campus route guide lives at `assets/lhp-to-hcmus-3d-route-v2.png`. It shows the recommended route from parking inside Lê Hồng Phong, out to Nguyễn Văn Cừ, through the HCMUS main gate, and into Hall I. Route highlights and labels are controlled by the `.map-canvas` styles and `selectRoute()` in `app.js`.

## Local preview

Any static file server works. For example:

```powershell
npx serve .
```

## GitHub Pages

The included workflow deploys the repository root whenever `main` is updated. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once if it is not already selected.
