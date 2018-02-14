import React, { Component } from 'react';
import './App.css';
import { Button, FormGroup, FormControl, ControlLabel, SplitButton, MenuItem } from 'react-bootstrap';

import recognizeMic from 'watson-speech/speech-to-text/recognize-microphone';
import synthetize from 'watson-speech/text-to-speech/synthesize';
import getVoices from 'watson-speech/text-to-speech/get-voices';

class App extends Component {
  constructor() {
    super()
    this.state = {}
    this.onChange = this.onChange.bind(this);
    this.onListenClick = this.onListenClick.bind(this);
    this.onReadClick = this.onReadClick.bind(this);
  }

  componentDidMount() {
    fetch('http://localhost:3002/api/text-to-speech/token')
      .then((response) => {
        return response.text();
      })
      .then((token) => {
        getVoices({ token: token })
          .then((voices) => {
            let USvoices = voices.filter(obj => obj.language === 'en-US');
            this.setState({ voices: USvoices });
            console.log(this.state.voices);
          });
      })

  }

  onChange(e) {
    this.setState({ value: e.target.value });
  }

  onListenClick() {

    fetch('http://localhost:3002/api/speech-to-text/token')
      .then(function(response) {
          return response.text();
      }).then((token) => {
        var stream = recognizeMic({
            token: token,
            objectMode: true, // send objects instead of text
            extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
            format: false // optional - performs basic formatting on the results such as capitals an periods
        });
        stream.on('data', (data) => {
          this.setState({
            text: data.alternatives[0].transcript
          })
        });
        stream.on('error', function(err) {
            console.log(err);
        });
        // document.querySelector('#stop').onclick = stream.stop.bind(stream);
      }).catch(function(error) {
          console.log(error);
      });
  }
  onReadClick() {
    const text = this.state.value;

    fetch('http://localhost:3002/api/text-to-speech/token')
      .then(function (response) {
        return response.text();
        }).then(function (token) {
          synthetize({
            voice: "en-US_LisaVoice",
            text: text,
            token: token
          })
      })
    }      
     
        
  render() {
    let voices = this.state.voices ? this.state.voices : [];
    console.log(voices);
    return (
      <div className="App">
        <button onClick={this.onListenClick.bind(this)}>Listen to microphone</button>
        <div style={{ fontSize: '40px' }}>{this.state.text}</div>
        <FormGroup controlId="formControlsTextarea">
          <ControlLabel>Type here for it to be read </ControlLabel>
          <FormControl
            componentClass="textarea"
            placeholder="textarea"
            value={this.state.value}
            onChange={this.onChange}
            />
        </FormGroup>
        <Button
          type="submit"
          onClick={this.onReadClick.bind(this)}>
          Read</Button>
        <SplitButton
          title='Primary'
          key={1}
          id={`split-button-basic-${1}`}
  
        >
          {this.state.voices ? this.state.voices.map((obj) => {
            return <MenuItem key={obj.name} eventKey={obj.name}>{obj.name}</MenuItem>
            
        }) : ''}  
        </SplitButton>


      </div>
    );
  }
}

export default App;
