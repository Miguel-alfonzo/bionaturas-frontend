# Bionatura's Design System Premium Implementation Plan

## Overview
This plan outlines the steps to implement the Design System Premium for the Bionatura's project, focusing on configuring the color scheme, typography, and component styling according to the specified requirements.

## Design System Variables

### Colors
- **background**: #FDFDFD
- **card**: #FFFFFF
- **text-main**: #1F2937
- **primary-green**: #0B5D34 (Used for buttons and active borders)
- **accent-orange**: #E97D14 (Used only for secondary alerts or badges)
- **input-bg**: #F3F4F6

### Shadows
- **premium-shadow**: 0 10px 25px -5px rgba(11, 93, 52, 0.05)

### Fonts
- **Titles**: Plus Jakarta Sans
- **Body**: Inter

## Implementation Steps

### 1. Create tailwind.config.ts
We need to create a Tailwind configuration file that includes:
- Custom color palette with the specified colors
- Custom shadow definition
- Extended theme configuration

The configuration will extend Tailwind's default theme with our custom values, making them available throughout the application.

### 2. Update app/layout.tsx
We need to:
- Import the Plus Jakarta Sans and Inter fonts from Google Fonts
- Configure font variables
- Apply the fonts to the appropriate elements
- Update metadata for the application

### 3. Modify app/globals.css
We need to:
- Set the default background color to #FDFDFD
- Set the default text color to #1F2937
- Update CSS variables and theme settings
- Remove any dark mode configurations that aren't needed

### 4. Rewrite app/page.tsx
We need to create a test view that includes:
- A centered container
- An H1 heading with the Plus Jakarta Sans font
- A white card with the premium-shadow and rounded borders
- A test input field with #F3F4F6 background that shows a primary-green ring on focus
- A primary button with primary-green background and white text
- A small badge or secondary button in accent-orange

## Expected Outcome
After implementing these changes, the application will have a consistent design system with the specified colors, typography, and component styling. The test view will demonstrate the design system in action, showcasing the various elements and their interactions.