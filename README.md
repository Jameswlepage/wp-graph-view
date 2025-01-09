# Graph View

**Graph View** is a React-based WordPress plugin that visualizes your site's content as interactive graphs using Cytoscape.js. Inspired by tools like Obsidian, it provides a dynamic way to explore relationships between posts, pages, taxonomies, and internal links both in the admin dashboard and on the frontend.

## Features

- **Interactive Graph Visualization**: Visualize your WordPress content relationships in a dynamic graph interface.
- **Admin Dashboard Integration**: Access and manage your site's graph directly from the WordPress admin panel.
- **Gutenberg Editor Sidebar**: Enhance the Gutenberg editing experience with a sidebar panel displaying related content graphs.
- **Frontend Display**: Automatically insert interactive graphs above or below your posts and pages.
- **Customizable Settings**: Configure graph display options, including automatic insertion and positioning.
- **Responsive Design**: Ensures optimal viewing across various devices and screen sizes.
- **REST API Endpoints**: Efficiently fetch graph data with customizable REST API routes.

## Installation

1. **Download the Plugin**

   Download the latest version of the Graph View plugin from the [GitHub repository](https://github.com/Jameswlepage/wp-graph-view) or the WordPress plugin repository.

2. **Upload to WordPress**

   - **Via WordPress Admin:**

     - Navigate to `Plugins > Add New`.
     - Click on `Upload Plugin`.
     - Choose the downloaded `my-graph-view.zip` file.
     - Click `Install Now` and then `Activate`.

   - **Via FTP:**
     - Extract the `my-graph-view.zip` file.
     - Upload the `my-graph-view` folder to the `/wp-content/plugins/` directory.
     - Navigate to `Plugins` in the WordPress admin and activate **Graph View**.

3. **Build Assets (Developer Setup Only)**

   If you're modifying the plugin's source code:

   ```bash
   cd my-graph-view
   npm install
   npm run build
   ```

## Usage

### Admin Dashboard

1. **Access Graph View**

   - Navigate to `Graph View` in the WordPress admin sidebar.
   - Explore the interactive graph representing your site's content relationships.

2. **Settings**

   - Go to `Graph View > Settings`.
   - **Automatically Insert Mini-Graph**: Toggle whether to display a graph on single posts/pages.
   - **Graph Position**: Choose to display the graph above or below the content.
   - Click `Save Settings` to apply changes.

### Gutenberg Editor

1. **Open Gutenberg Editor**

   - Edit or create a new post/page using the Gutenberg editor.

2. **Graph Panel**

   - In the document settings sidebar, find the `Graph View` panel.
   - View a miniature graph highlighting relationships related to the current post/page.

### Frontend Display

- Based on your settings, an interactive graph will automatically appear above or below your post/page content.
- **Interactivity**:
  - **Hover**: Display information about nodes (posts/pages) and edges (relationships).
  - **Click**: Open the related post/page in a new tab or navigate to it directly.

## Customization

### Graph Appearance

- **Theme Colors**: The plugin adapts to your theme's primary and secondary colors. You can define custom colors in the settings or modify the `graphview_get_theme_colors` function in `plugin.php`.

### REST API Endpoints

- **Full Graph**: `/wp-json/graphview/v1/full-graph`

  - **Method**: GET
  - **Permissions**: `manage_options`
  - **Description**: Retrieves the entire site graph data.

- **Local Graph**: `/wp-json/graphview/v1/local-graph/{post_id}`
  - **Method**: GET
  - **Permissions**: Public
  - **Description**: Retrieves graph data related to a specific post/page.

### Development

- **Scripts**:

  - `npm run build`: Builds production assets.
  - `npm run dev`: Watches and builds assets during development.
  - `npm run bundle`: Builds and packages the plugin into a zip file.

- **Webpack Configuration**: Located in `webpack.config.js`, customize entry points, output directories, and externals as needed.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add some feature"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature
   ```

5. **Open a Pull Request**

## Support

If you encounter any issues or have questions, please open an issue in the [GitHub repository](https://github.com/Jameswlepage/wp-graph-view/issues) or contact the author.

## Changelog

### 2.0.0

- Major update with React-based admin interface.
- Introduced Gutenberg editor sidebar panel.
- Enhanced frontend graph visualization with automatic insertion options.
- Improved REST API endpoints for fetching graph data.
- Added comprehensive settings page for customization.

## License

This plugin is licensed under the [GPL-2.0+](http://www.gnu.org/licenses/gpl-2.0.txt) license.

---

**Author:** James LePage  
**Website:** [https://www.j.cv](https://www.j.cv)  
**Version:** 2.0.0

---

> **Note:** Ensure that your theme supports the necessary styles and scripts for optimal integration with Graph View.
