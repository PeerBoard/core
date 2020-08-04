### Usage

See [more detailed tutorial in our community](https://community.peerboard.com/post/1162435747)

```bash
yarn add @peerboard/core 
```
or
```bash
npm install @peerboard/core 
``` 

#### Example integration into react application
```jsx
// ...
import { createForum } from '@peerboard/core';
import { withRouter } from 'react-router-dom';

class Forum extends React.Component {
  containerRef = React.createRef();
  constructor(props) {
    super(props);
    this.jwtToken = null;
    this.prefix = 'community';
    this.state = {
      authReady: false,
      forumReady: false,
      error: null,
    };
  }

  componentDidMount() {
    http.generateBearerToken((document.location.pathname || "/").replace('/' + this.prefix, '')).then((result) => {
      this.jwtToken = result.token;
      this.setState({
        authReady: true,
      });
      createForum(413170950, this.containerRef.current, {
        prefix: this.prefix,
        jwtToken: this.jwtToken,
        minHeight: "900px",
        onReady: () => {
          this.setState({
            forumReady: true,
          });
        },
        onTitleChanged: (title) => window.document.title = "Community: " + title,
        onPathChanged: (location) => {
          // Browser counts iframe state changes.
          this.props.history.replace(location);
        },
        onCustomProfile: (url) => {
          this.props.history.push(url.replace(window.location.origin, ''));
        },
      }).catch(err => {
        this.setState({
          error: "Failed to load forum",
        });
      });
    })
  }

  renderForum() {
    return <div>
      {!(this.state.authReady && this.state.forumReady) && 'Loading...'}
      <div ref={this.containerRef} style={{
        visibility: this.state.forumReady ? 'visible' : 'hidden',
      }}>
      </div>
    </div>
  }

  render() {
    return (
      <div>
        {this.state.error ? (this.state.error) : (this.renderForum())}
      </div>
    );
  }
}

// ...

```
