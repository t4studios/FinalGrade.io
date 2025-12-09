# 🔥 FinalGrade.io

> **A powerful, modern grade calculation tool for teachers and students**

[![Version](https://img.shields.io/badge/Version-26.0.0--beta-blue.svg)](UPDATES.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)](STATUS.md)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
  - [Teacher View](#teacher-view)
  - [Student View](#student-view)
- [Grade Calculation](#grade-calculation)
- [File Structure](#file-structure)
- [Technology Stack](#technology-stack)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)
- [Additional Resources](#additional-resources)

## 🎯 Overview

**FinalGrade.io** is a fully-featured, browser-based grade calculator designed for educational institutions. It provides teachers with a comprehensive tool to manage grades across multiple categories and assignments, while offering students a clear view of their academic progress.

Built with modern web technologies and featuring a beautiful, responsive UI, FinalGrade.io makes grade management intuitive and efficient. All data is stored locally in your browser—no server connections, no data uploads, complete privacy.

### Key Highlights

✨ **Zero-Server Architecture** - All data stays on your device  
🎨 **Modern UI/UX** - Smooth animations and intuitive design  
📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile  
⚡ **Real-time Calculations** - Instant grade updates as you enter data  
🔐 **Private & Secure** - No external data transmission  
🚀 **Fast Performance** - Lightweight and optimized  

## ✨ Features

### Teacher Features

- **📊 Grade Category Management**
  - Create unlimited grade categories
  - Assign custom weights to each category
  - Enable/disable categories as needed
  - Drag-and-drop reordering

- **📝 Assignment Tracking**
  - Add multiple assignments per category
  - Set points and total points
  - Apply multipliers to assignments
  - Track assignment status (Turned In, Missing, Late, etc.)
  - Add detailed comments to assignments

- **🧮 Advanced Calculations**
  - Weighted grade calculation (percentage or points-based)
  - Real-time overall grade computation
  - Grade capping feature (maximum grade capacity)
  - Support for decimal places (0, 1, or 2 places)

- **🎛️ Bulk Operations**
  - Remove multiple assignments at once
  - Remove multiple categories at once
  - Reset all data with one click (with confirmation)

- **💾 Data Management**
  - Auto-save functionality (every 2 seconds)
  - Full data persistence via localStorage
  - No data loss on browser refresh

### Student Features

- **📖 Grade Summary View**
  - View all categories and current grades
  - See assignment breakdowns per category
  - View assignment comments
  - Check weighted contributions

- **📊 Real-time Grade Tracking**
  - Live overall grade calculation
  - Category-specific grades
  - Expandable/collapsible category details
  - Assignment status indicators

- **🔄 Refresh Functionality**
  - Update grade display on demand
  - Sync with latest teacher entries

## 🚀 Getting Started

### Quick Start

1. **Open FinalGrade.io**
   - Visit the application in your web browser
   - No installation or signup required

2. **First Load**
   - The application comes with default categories and example assignments
   - Start customizing immediately

3. **Switch Views**
   - Use the navigation tabs to switch between Teacher and Student views
   - Each view is optimized for its audience

### Default Categories (On First Load)

When you first open FinalGrade.io, you'll see these pre-configured categories:

| Category | Weight | Assignment |
|----------|--------|------------|
| 4.5 Week Progress | — | In Progress (blank/100) |
| 9 Week Progress | — | In Progress (blank/100) |
| 13.5 Week Progress | — | In Progress (blank/100) |
| 18 Week Progress | — | In Progress (blank/100) |
| Final Avg. | — | Final Avg. (blank/100) |
| Final | 10% | Example Assignment (100/100) |
| Formative | 40% | Example Assignment (100/100) |
| Summative | 50% | Example Assignment (100/100) |
| Uncategorized Assignment | 0% | Example Assignment (100/100) |

## 📖 Usage

### Teacher View

#### Creating a Category

1. Click the **"+ Add Category"** button
2. Enter the category name (e.g., "Midterm Exam")
3. Set the weight percentage (e.g., 30 for 30%)
4. Click **"Create"**

#### Adding Assignments

1. Click **"+ Add Assignment"** under the desired category
2. Enter assignment details:
   - **Name**: Assignment description
   - **Graded Pts**: Points earned by student
   - **Total Pts**: Maximum possible points
   - **Multiplier**: Weight multiplier (default: 1.0)
   - **Status**: Select from dropdown (Turned In, Missing, Late, etc.)
3. Assignments auto-save to localStorage

#### Managing Assignments

- **Duplicate**: Click the copy icon to duplicate an assignment
- **Comment**: Click the comment icon to add feedback
- **Delete**: Click the red X to remove an assignment
- **Status Tracking**: Use status dropdowns for quick updates

#### Editing Categories

1. Click the **edit icon** next to category name
2. Modify name and/or weight
3. Click **"Save"**

#### Advanced Options

- **Toggle Category**: Enable/disable without deleting
- **Remove Selected Assignments**: Bulk delete assignments
- **Remove Selected Categories**: Bulk delete categories
- **Reset Everything**: Clear all data and restart (shows confirmation)

#### Calculating Grades

Click **"Calculate Overall Grade"** to compute weighted averages. The system automatically:
- Calculates category averages
- Applies weights
- Caps grades (if configured)
- Updates both views

### Student View

#### Viewing Grades

1. Switch to **Student View** tab
2. See all categories with current grades
3. View **Overall Grade** in top right
4. Expand/collapse categories to see assignments

#### Category Information

Each category shows:
- **Category Name** + Current Grade (e.g., "Formative 85%")
- **Weight**: How much this category counts (e.g., "Weight: 40")
- **Expandable Assignments**: Click to view assignment details

#### Assignment Details

Click any assignment to see:
- Assignment name
- Points earned / total points
- Percentage calculation
- Status (if assigned)
- Teacher comments

#### Refreshing Grades

Click **"Refresh Current Grade"** to update all displayed grades with latest teacher data.

## 🧮 Grade Calculation

### Weighted Grade Formula

FinalGrade.io uses industry-standard weighted grade calculation:

**Weighted Grade = Σ(Category Grade × Category Weight) / Σ(Category Weights)**

#### Example 1: Percentage Weights

```
Math: 80, Weight: 30%
Biology: 90, Weight: 50%
History: 72, Weight: 20%

Weighted Grade = (0.30 × 80) + (0.50 × 90) + (0.20 × 72)
               = 24 + 45 + 14.4
               = 83.4
```

#### Example 2: Points-Based Weights

```
Math: 80, Weight: 3 points
Biology: 90, Weight: 5 points
History: 72, Weight: 2 points

Weighted Grade = (3×80 + 5×90 + 2×72) / (3+5+2)
               = (240 + 450 + 144) / 10
               = 834 / 10
               = 83.4
```

### Category Averaging

Each category's grade is calculated as:

**Category Grade = Σ(Assignment Grade × Multiplier) / Σ(Multipliers)**

### Status Impact on Grades

Certain statuses automatically affect grades:
- **Missing/Cheated**: Counts as 0%
- **Dropped/Excused/Exempt**: Excluded from calculation
- **Late/Incomplete**: Included in calculation (use comment for notes)

### Grade Capping

Use the **"Maximum Grade Capacity"** setting to cap overall grades:
- Default: 100%
- Set to higher values to allow extra credit
- Set to lower values to enforce strict caps

## 📁 File Structure

```
finalgrades/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and animations
├── main.js             # Core functionality and logic
└── README.md           # This file
```

### File Descriptions

#### `index.html` (5,500+ lines)
- Complete semantic HTML structure
- Modal dialogs for all interactions
- Form inputs and controls
- Navigation tabs
- Footer with links

#### `styles.css` (2,000+ lines)
- Modern, responsive design
- Smooth animations and transitions
- Custom scrollbars
- Mobile-first approach
- Dark mode ready

#### `main.js` (3,000+ lines)
- Grade calculation engine
- Data persistence (localStorage)
- DOM manipulation and event handling
- Modal management
- Real-time updates

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| **HTML5** | Semantic markup | Latest |
| **CSS3** | Styling & animations | Latest |
| **JavaScript (ES6+)** | Core logic | Latest |
| **localStorage API** | Data persistence | Native |

### Libraries & Resources

- **Google Fonts**
  - Plus Jakarta Sans (headers)
  - Inter (body text)
  
- **Material Design Icons**
  - 30+ icons for UI elements
  - Semantic icon meanings

- **No External Dependencies**
  - Pure vanilla JavaScript
  - No framework required
  - Minimal performance overhead

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Excellent |
| Safari | ✅ Full | Works great |
| Edge | ✅ Full | Modern versions |
| Opera | ✅ Full | Chromium-based |
| IE 11 | ❌ Not Supported | Too old |

### Requirements

- localStorage support (all modern browsers)
- ES6 JavaScript support
- CSS Grid & Flexbox support
- Modern DOM APIs

## 🔒 Privacy & Security

### Data Storage

- **No Cloud Storage**: All data stays on your device
- **No Servers**: No external connections
- **No Tracking**: No analytics or telemetry
- **localStorage**: Browser's local storage API

### Data Access

- Only you can access your data
- Clearing browser data will delete grades
- No automatic backups (manual export recommended)
- Recommended: Export data regularly

### What We Don't Collect

✓ We don't collect personal information  
✓ We don't track browsing behavior  
✓ We don't store data on servers  
✓ We don't use cookies for tracking  
✓ We don't share data with third parties  

## 🎨 UI/UX Features

### Design Elements

- **Modern Color Scheme**
  - Primary: #1976d2 (Blue)
  - Error: #f44336 (Red)
  - Success: #4CAF50 (Green)
  - Neutral: #999999 (Gray)

- **Smooth Animations**
  - Pop-out effects (0.4s)
  - Fade transitions (0.3s)
  - Slide animations (0.3s)
  - Hover effects throughout

- **Responsive Design**
  - Mobile-first approach
  - Tablet optimizations
  - Desktop enhancements
  - Touch-friendly controls

### Accessibility Features

- Semantic HTML
- ARIA labels
- Keyboard navigation support
- High contrast colors
- Clear visual hierarchy
- Readable typography

## 💡 Tips & Best Practices

### For Teachers

1. **Set Weights Early**
   - Establish category weights before entering grades
   - Communicate weights to students

2. **Use Comments**
   - Add feedback via assignment comments
   - Help students understand performance

3. **Regular Backups**
   - Export data periodically
   - Keep local copies of important gradebooks

4. **Status Tracking**
   - Use status dropdowns for incomplete work
   - Document extensions and excuses

5. **Organize Categories**
   - Use drag-and-drop to arrange logically
   - Group similar assessment types

### For Students

1. **Regular Check-ins**
   - Monitor your progress regularly
   - Don't wait until end of term

2. **Understand Weights**
   - Ask teacher to explain category weights
   - Understand where grade matters most

3. **Read Comments**
   - Pay attention to teacher feedback
   - Use comments to improve performance

## 🐛 Troubleshooting

### Common Issues

**Q: My data disappeared!**
A: Check if you cleared browser data. Consider using "Reset Everything" only when intentional.

**Q: Grades won't update**
A: Click "Calculate Overall Grade" button in Teacher View.

**Q: Student View looks different**
A: Refresh the page or switch tabs. Student View updates when recalculating.

**Q: Weight not showing**
A: Weights of 0% or blank are hidden. Set a weight value to display.

### Data Recovery

**Important**: There is no automatic backup. To prevent data loss:

1. Use modern browsers (Chrome, Firefox, Edge)
2. Don't clear browser data/cache
3. Consider exporting grades periodically
4. Use separate devices if possible

## 📈 Version History

### v26.0.0-beta (December 2025) - Current

**Latest Release with Major Improvements**

- Complete UI redesign with modern animations
- Improved loading screen with visual feedback
- Enhanced modal dialogs with smooth transitions
- Custom scrollbars throughout application
- Better responsive design for mobile devices
- Fixed category comment display
- Weight formatting improvements
- Student view synchronization
- Default categories on first load
- Reset Everything functionality
- Pop-out animations for all modals
- Reset confirmation modal

### v25.4.0 (November 2025)

- Fixed assignment status tracking
- Improved calculation accuracy
- Student view enhancements

### v25.3.0 (October 2025)

- Added comment system for assignments
- Improved category management
- Bug fixes and performance improvements

### v25.2.0 (August 2025)

- Student view implementation
- Assignment multiplier feature
- Enhanced grade capping system

### v25.1.0 (May 2025)

- Initial release of FinalGrade.io
- Basic grade calculation
- Category and assignment management

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use consistent indentation (spaces, not tabs)
- Comment complex logic
- Keep functions focused and small
- Follow existing naming conventions

### Reporting Issues

Found a bug? Please report it with:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Share ideas in GitHub Discussions
- **Documentation**: Read this README thoroughly
- **Email**: Contact the development team

## 🙏 Acknowledgments

- Google Fonts for beautiful typography
- Material Design for icon inspiration
- Modern web standards & best practices
- Open source community inspiration

## 📚 Additional Resources

### Important Documents

- **[📋 UPDATES.md](UPDATES.md)** - Complete version history, release notes, and what's new
  - v26.0.0-beta (December 2025) - Latest release
  - v25.4.0 (November 2025) - Previous release
  - v25.3.0 (October 2025)
  - v25.2.0 (August 2025)
  - v25.1.0 (May 2025)
  - Roadmap and future plans
  - FAQ and upgrade guide

- **[📜 LICENSE.md](LICENSE.md)** - MIT License and terms
  - Full license text and explanation
  - Usage rights and restrictions
  - Copyright notice
  - Warranty disclaimer
  - Commercial use guidelines
  - Third-party components

- **[📊 STATUS.md](STATUS.md)** - Current system status and metrics
  - System operational status
  - Performance metrics
  - Known issues (if any)
  - Incident history
  - Maintenance schedule
  - Support information

### External Links

- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS-Tricks](https://css-tricks.com/)
- [JavaScript Info](https://javascript.info/)
- [Web.dev](https://web.dev/)

---

**Made with 🔥 by the FinalGrade.io Team**

**Happy Grading! 📊**

---

## Changelog

### Latest Updates (v26.0.0-beta)

- ✨ Added comprehensive pop-out animations
- 🎯 Fixed weight display formatting
- 📱 Improved student view consistency
- 🔄 Enhanced data persistence
- 🎨 Modern UI with smooth transitions
- 🚀 Performance optimizations
- 🐛 Bug fixes and stability improvements

---

*Last Updated: December 2025*  
*Maintained by: FinalGrade.io Team*  
*Repository: github.com/yourusername/finalgrades*