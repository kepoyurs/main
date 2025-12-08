# Client Performance Dashboard

An AI-powered analytics dashboard that automatically extracts and visualizes metrics from performance screenshots and PDFs. Upload reports from social media, website analytics, and SEO tools, and let Claude AI extract the data for you.

## Features

### AI-Powered Data Extraction
- **Vision Analysis**: Uses Claude 3.5 Sonnet to automatically read and extract metrics from screenshots
- **Bulk Upload**: Process multiple files at once
- **Smart Parsing**: Automatically identifies metrics, values, percentages, and trends
- **Multi-Source Support**: Handles screenshots from Instagram, Google Analytics, SEMrush, Ahrefs, and more

### Data Visualization
- **Metric Cards**: Clean, organized display of extracted metrics
- **Trend Indicators**: Shows increases/decreases with visual indicators
- **Category Filtering**: Filter by Social Media, Website Analytics, or SEO Performance
- **Real-time Updates**: Dashboard updates instantly as you upload new reports

### File Support
- **Images**: PNG, JPG, GIF, WebP
- **PDFs**: Full-page PDF reports automatically rendered and analyzed
- **Drag & Drop**: Easy bulk upload interface

### Privacy & Storage
- **Local Storage**: All data stored in your browser
- **API Key Security**: Your Claude API key is stored locally and only sent to Anthropic's API
- **No Server Required**: 100% client-side application

## Getting Started

### 1. Get a Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Generate an API key
4. Copy the key (starts with `sk-ant-`)

### 2. Configure the Dashboard

1. Open `index.html` in your web browser
2. Click the "Settings" button
3. Paste your Claude API key
4. Click "Test Connection" to verify
5. Click "Save Settings"

### 3. Upload Performance Reports

1. Click "Upload Reports"
2. Drag and drop screenshots or PDFs (or click to browse)
3. Upload multiple files at once for bulk processing
4. Wait for AI analysis to complete
5. View extracted metrics in the dashboard

## How It Works

1. **Upload**: You upload screenshots or PDFs of your performance reports
2. **Analysis**: Claude AI analyzes each image and identifies all visible metrics
3. **Extraction**: Metrics are extracted with labels, values, changes, and context
4. **Display**: Data is displayed as clean metric cards with trend indicators
5. **Storage**: All metrics are saved locally in your browser

## Extracted Metrics

The dashboard automatically extracts:

- **Metric Names**: Followers, Page Views, Engagement Rate, etc.
- **Values**: Numbers formatted with units (K, M, %, etc.)
- **Changes**: Percentage increases or decreases
- **Time Periods**: Date ranges and reporting periods
- **Platforms**: Source platform (Instagram, Google Analytics, etc.)
- **Categories**: Auto-categorized as Social Media, Website, or SEO

## Usage

### Uploading Reports
- **Single Upload**: Upload one file at a time
- **Bulk Upload**: Select multiple files or drag a folder
- **Mixed Formats**: Combine images and PDFs in one upload

### Managing Data
- **Filter**: Use the dropdown to show specific categories
- **Delete**: Click the trash icon on any metric card to remove it
- **Clear All**: Remove all metrics (with confirmation)

### Best Practices
- Use high-quality screenshots with clear, readable text
- Upload screenshots with full metric labels visible
- Include comparison data (% changes) when available
- Name files descriptively for easier tracking

## Browser Compatibility

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Claude 3.5 Sonnet (vision model)
- **Visualization**: Chart.js
- **PDF Rendering**: PDF.js
- **Storage**: Local Storage API

## Design

- **Minimalist**: Clean white and gray color palette
- **Modern**: Contemporary typography and spacing
- **Responsive**: Works on desktop, tablet, and mobile
- **Fast**: Client-side processing with no server delays

## Privacy

Your data never leaves your browser except to:
- Send images to Anthropic's Claude API for analysis
- Receive extracted metrics back from the API

We do NOT:
- Store your data on any server
- Send data to third parties
- Track your usage
- Require account creation

## Cost

The dashboard is free to use. You only pay for Claude API usage:
- ~$0.008 per image analyzed (Claude 3.5 Sonnet pricing)
- Example: 100 screenshots = ~$0.80

## Troubleshooting

**"Please configure your Claude API key"**
- Go to Settings and add your API key

**"Connection failed"**
- Check your API key is correct
- Verify you have API credits in your Anthropic account
- Check your internet connection

**Metrics not extracted**
- Ensure screenshot text is clear and readable
- Try a higher resolution image
- Verify the image contains visible metrics

**Browser storage full**
- Clear old metrics using "Clear All"
- Browser localStorage limit is typically 5-10MB

## Future Enhancements

- Chart visualizations for trends over time
- Export data as CSV/Excel
- Comparison views between time periods
- Custom metric templates
- Team sharing features

## Support

For issues or questions:
- Check browser console for errors
- Verify API key is valid
- Ensure images are high quality and readable

## License

This is an open-source project. Feel free to modify and use as needed.
