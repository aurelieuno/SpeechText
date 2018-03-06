import React, { Component } from 'react';
import './App.css';
import { Button, FormGroup, FormControl, ControlLabel, SplitButton, MenuItem } from 'react-bootstrap';
import recognizeMic from 'watson-speech/speech-to-text/recognize-microphone';
import synthetize from 'watson-speech/text-to-speech/synthesize';
import getVoices from 'watson-speech/text-to-speech/get-voices';
import unirest  from 'unirest';
import axios from 'axios';

class App extends Component {
  constructor() {
    super()
    this.state = { voice: "en-US_AllisonVoice"}
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
          });
      })
  }

  onChange(e) {
    this.setState({ value: e.target.value });
  }
  onSelect(e) {
    this.setState({ voice: e });
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
    const textArr = text.split(' ');
    let translation = [];

    fetch('http://localhost:3002/api/text-to-speech/token')
      .then((response) => {
        return response.text();
      }).then((token) => {
        synthetize({
          voice: this.state.voice,
          text: text,
          token: token
        })
      })
    
    const getWord = (word) => axios.get(`https://wordsapiv1.p.mashape.com/words/${word}`,
      {
        headers: { "X-Mashape-Key": "T2GceUy2gYmshH4ZGFF0EMTG9cZtp1EWiwtjsnJQFOW1vvErpR", "X-Mashape-Host": "wordsapiv1.p.mashape.com" },
      })
    
    const finalArr = textArr.map(word => getWord(word));
    axios.all(finalArr).
      then(result => {
        let translatedArr = result.map(result => typeof result.data.pronunciation === 'string' ? result.data.pronunciation : result.data.pronunciation.all);
        this.setState({ translation: translatedArr });
        console.log(translatedArr);
      })  

    }      
     
        
  render() {
    let voices = this.state.voices ? this.state.voices : [];
    let translation = this.state.translation ? this.state.translation.join(' ') : '';
    return (
      <div className="App">
        <h1 style={{ fontFamily: 'Fjalla One', fontSize: '60pt', color: 'rgba(0, 109, 204, 1)' }}>IPA TRANSLATION</h1>  

        <FormGroup controlId="formControlsTextarea">
          <FormControl
            componentClass="textarea"
            placeholder="Type here..."
            value={this.state.value}
            onChange={this.onChange}
            style={{marginTop: '40px', marginLeft: '40px'}}
            />
        </FormGroup>
        <Button
          type="submit"
          onClick={this.onReadClick.bind(this)}
          bsStyle="primary"
          style={{ marginRight: '10px' }}>
          Read</Button>
        <SplitButton
          bsStyle={"primary" } 
          title={this.state.voice? this.state.voice : 'Pick Voice'}
          key={1}
          id={`split-button-basic-${1}`}
        >
          {this.state.voices ? this.state.voices.map((obj) => {
            return <MenuItem key={obj.name} eventKey={obj.name} onSelect={this.onSelect.bind(this)}>{obj.name}</MenuItem>
        }) : ''}  
        </SplitButton>
        <div style={{ fontSize: '30px', marginTop: '50px', backgroundColor: 'rgba(0, 109, 204, 0.3)', borderRadius: '5px', marginLeft: '40px', width: '90%'}}>{translation}</div>
      </div>
    );
  }
}

export default App;
