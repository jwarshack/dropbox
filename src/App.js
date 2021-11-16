import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react';
import Web3 from 'web3';
import DStorage from './abis/DStorage.json';

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

class App extends Component {

  async componentDidMount() {
    await this.ethEnabled();
    await this.loadBlockChainData();

  }

  ethEnabled = async () =>{
    if(window.ethereum) {
      await window.ethereum.send('eth_requestAccounts');
      window.web3 = new Web3(window.ethereum);
      return true;
    }

    return false;
  }

  loadBlockChainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = DStorage.networks[networkId];
    if(networkData) {
      const dstorage = new web3.eth.Contract(DStorage.abi, networkData.address);
      this.setState({ dstorage });

      const fileCount = await dstorage.methods.fileCount().call();
      this.setState({ fileCount });

      for (var i = fileCount; i >= 1; i--) {
        const file = await dstorage.methods.files(i).call();
        this.setState({
          files: [...this.state.files, file]
        })
      }
    } else {
      window.alert('Dstorage has not been deployed to the network.');
    }

  }

  captureFile = event => {
    event.preventDefault();

    const file = event.target.files[0];
    const reader = new window.FileReader();

    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
        type: file.type,
        name: file.name
      })
      console.log('buffer', this.state.buffer);
    }

  }

  uploadFile = description => {
    console.log('submitting to IPFS');
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result)
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      dstorage: null,
      fileCount: 0,
      files: []
    }
  }


  render() {
    return(
      <div>
        <nav className="navbar navbar-dark bg-dark">
          <div className="container">
            <a href="#" className="navbar-brand">
              DStorage
            </a>
            <ul className="navbar-nav">
              <li className="nav-item">
                <small className="text-secondary"><span>{this.state.account}</span></small>
              </li>
            </ul>
          </div>
        </nav>
        <div className="container-fluid mt-5 text-center">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{maxWidth: '1024px'}}>
              <div className="content">
                <p>&nbsp;</p>
                <div className="card mb-3 mx-auto bg-dark" style={{maxWidth: '512px'}}>
                  <h2 className="text-white text-monospace bg-dark"><b><ins>Share File</ins></b></h2>
                  <form onSubmit={(event) => {
                    event.preventDefault();
                    const description = this.fileDescription.value;
                    this.props.uploadFile(description);
                  }}>
                    <div className="form-group">
                      <br></br>
                      <input
                        id="fileDescription"
                        type="text"
                        ref={(input) => { this.fileDescription = input }}
                        className="form-control text-monospace"
                        placeholder="description"
                        required />
                    </div>
                    <input type="file" onChange={this.captureFile} className="text-white text-monospace"/>
                    <button type="submit" className="btn-primary btn-block"><b>Upload!</b></button>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
