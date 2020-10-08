### Usage

See [more detailed tutorial in our community](https://community.peerboard.com/post/1162435747)

```bash
yarn add @peerboard/core
```
or
```bash
npm install @peerboard/core 
``` 

#### Example pseudo code integration with react
```jsx
import React from 'react';
import { createForum } from '@peerboard/core';

// Settings -> Hosting -> Board ID
const boardID = '<BOARD ID FROM COMMUNITY SETTINGS>';

// Assuming the forum index is rendered at yourdomain.com/your-path
const prefix = '/your-path';

class Forum extends React.Component {

  containerRef = React.createRef();

  state = {
    error: null,
    forumReady: false,
  };

  async initForum() {
    const jwtToken = await yourbackend.generateBearerToken();
    
    // Get the token from your backend
    createForum(boardID, this.containerRef.current, {
      prefix,
      jwtToken,
      
      // in px
      minHeight: window.innerHeight - YOUR_HEADER_HEIGHT - YOUR_FOOTER_HEIGHT,
      
      onReady: () => this.setState({
        forumReady: true,
      }),
      onFail: () => this.setState({
        error: "Failed to load forum",
      }),
      
      // Customize your title
      onTitleChanged: (title) =>
        window.document.title = "Community: " + title,
      
      // Use state replace method of 
      // your router's history or the native one
      onPathChanged: location => 
         this.props.history.replace(location),
      
      // If you are using custom profiles features 
      // and want seamless transition between pages   
      onCustomProfile: (url) =>
        this.props.history.push(url.replace(window.location.origin, '')),
    });
    
  }

  componentDidMount() {
    this.initForum().catch(err => this.setState({
      error: err.message,
    }));
  }

  render() {
    return (
      <div>
        {/* Show error, loader or render the forum */}
        {this.state.error && (this.state.error)}
        {!this.state.forumReady && 'Show a spinner...'}
        <div ref={this.containerRef}></div>
      </div>
    );
  }
}

// ...

```
