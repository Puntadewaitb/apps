# @tpl/ui

Design tokens + komponen bersama (React 19, Tailwind v4).

## Pakai di app

```css
/* app/globals.css */
@import "tailwindcss";
@import "@tpl/config/theme.css";
@import "@tpl/ui/theme.css";
@source "../../../packages/ui/src";
```

```tsx
import { Button, Section } from "@tpl/ui";
```

Ganti palet lewat `<html data-theme="netral | hangat | hijau">`.

Komponen: Button/ButtonLink, Container, Section, Navbar, Footer, WhatsAppButton, Card, Badge, Accordion, Modal, Lightbox, ToastProvider/useToast, FormField.
