import React, { Component } from 'react'
import { StyleSheet, View, Image, FlatList, Text, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'
import Realm from '../datastore'

import { NavigationActions, createAction } from '../utils'
import { computeSize } from '../utils/DeviceRatio'
import {
  Icon,
  List,
  Flex,
  WhiteSpace,
  Badge,
  Button,
  Modal,
  Toast,
  SearchBar,
  Card,
  WingBlank,
} from 'antd-mobile'
import _ from 'lodash'

const Item = List.Item
const Brief = Item.Brief
const prompt = Modal.prompt
const alert = Modal.alert

@connect(({ patient }) => ({ patient }))
class PatientList extends Component {
  constructor(props){
    super(props);

    this.state = {
      searchNameAndHospitl: '',
      searchDischarge: '',
      searchAdmitted: '',
    }
  }




  gotoNew = () => {
    this.props.dispatch(createAction('patient/updateActiveRecord')('clear'))
    this.props.dispatch(NavigationActions.navigate({ routeName: 'PatientFormNavigator' }))
  }

  componentDidMount() {
    this.getPatientList()
  }

  getPatientList = () => {
    this.props.dispatch(createAction('patient/getPatient')())
  }

  onHandleChange = (value,name) => {
    this.setState({
      [name]: value
    })
  };

  onSearch = (name,data_type) =>{
    const search  = this.state[name];

  if (_.isEmpty(this.state.searchNameAndHospitl) && _.isEmpty(this.state.searchDischarge) && _.isEmpty(this.state.searchAdmitted)) {
    this.getPatientList()
  }else {
     const reg = new RegExp(search, 'gi');

     let data = this.props.patient.records.map((record,i)=>{
       const match = record[data_type].match(reg);
       if (!match) {
         return null;
       }
       return {
         ...record
       }

     }).filter(record => !!record)

     this.props.dispatch({
          type:'patient/updateRecord',
          payload:data
        })
   }
  }

  onEdit = id => {
    return ()=>{
      const idx = _.findIndex(this.props.patient.records, { id })
      this.props.dispatch(
        createAction('patient/funcUpdateActiveRecord')(
          this.props.patient.records[idx]
        )
      )
      this.props.dispatch(NavigationActions.navigate({ routeName: 'PatientFormNavigator' }))
    }
  }


  onConfirmModal = (id, status) => () => {
    let paid = status ? 'Change to PAID' : 'Change to NOT PAID' ;
      alert(paid, 'Are you sure???', [
        { text: 'Cancel', onPress: () => console.log('cancel') },
        { text: 'Ok', onPress: this.onSuccessPaid(id,status) },
      ])
    }

  onSuccessPaid = (id,status) => () => {
      const idx = _.findIndex(this.props.patient.records, { id })

      const activeRecord = this.props.patient.records[idx]
      activeRecord.status = status;

      try {
        Realm.write(() => {
          const menu = Realm.create(
            'patient',
            {
              ...activeRecord,
            },
            true
          )
        })
      } catch (e) {
        console.log(e, 'error haha na boang napd')
      }

      Toast.success('Success !!!', 1)
      this.getPatientList()
    }

    renderItem = rowdata => (
      <WingBlank size="lg">
        <WhiteSpace size="lg" />
        <Card>
          <Card.Header
            title={
              <Text style={{fontSize:computeSize(35)}}>{rowdata.name}</Text>
            }
            extra={
              <TouchableHighlight onPress={this.onEdit(rowdata.id)} >
                  <Text style={{color:'#1890ff',fontSize:computeSize(25),textAlign:'right'}}>Edit Patient</Text>
              </TouchableHighlight>
            }
          />
          <Card.Body>
            <View style={{padding:computeSize(20)}}>
              <Flex wrap='wrap'>
                <Flex.Item style={{flex:0.3}}>
                  <Text style={{ fontSize: computeSize(30) }}>Hospital:</Text>
                </Flex.Item>
                <Flex.Item style={{flex:0.7}}>
                  <Text style={{ fontSize: computeSize(30) }}>{rowdata.hospital}</Text>
                </Flex.Item>
              </Flex>
              <Flex wrap='wrap'>
                <Flex.Item style={{flex:0.3}}>
                  <Text style={{ fontSize: computeSize(30) }}>Admitted:</Text>
                </Flex.Item>
                <Flex.Item style={{flex:0.7}}>
                  <Text style={{ fontSize: computeSize(30) }}>{rowdata.date_discharge}</Text>
                </Flex.Item>
              </Flex>

              <Flex wrap='wrap'>
                <Flex.Item style={{flex:0.3}}>
                  <Text style={{ fontSize: computeSize(30) }}>Discharge:</Text>
                </Flex.Item>
                <Flex.Item style={{flex:0.7}}>
                  <Text style={{ fontSize: computeSize(30) }}>{rowdata.date_discharge}</Text>
                </Flex.Item>
              </Flex>

              <WhiteSpace size="lg" />
              <Text style={{ fontSize: computeSize(30) }}>Payments</Text>
              <WhiteSpace size="lg" />
              
              <Flex wrap='wrap'>
                <Flex.Item style={{flex:0.3}}>
                  <Text style={{ fontSize: computeSize(30) }}>PF:</Text>
                </Flex.Item>
                <Flex.Item style={{flex:0.7}}>
                  <Text style={{ fontSize: computeSize(30),fontWeight: 'bold',color:'#f96268' }}>₱ {rowdata.pf}</Text>
                </Flex.Item>
              </Flex>

              <Flex wrap='wrap'>
                <Flex.Item style={{flex:0.3}}>
                  <Text style={{ fontSize: computeSize(30) }}>PF PhilHealth:</Text>
                </Flex.Item>
                <Flex.Item style={{flex:0.7}}>
                  <Text style={{ fontSize: computeSize(30),fontWeight: 'bold',color:'#f96268' }}>₱ {rowdata.pf_philhealth}</Text>
                </Flex.Item>
              </Flex>



            </View>
          </Card.Body>
          <Card.Footer extra={
            rowdata.status ? (
              <Button onClick={this.onConfirmModal(rowdata.id,false)} type="primary">
                Paid
              </Button>
            ): (
              <Button onClick={this.onConfirmModal(rowdata.id,true)} type="warning">
                Not Paid
              </Button>
            )
          } />
        </Card>
        <WhiteSpace size="lg" />
      </WingBlank>
      )



  _keyExtractor = (item, index) => index.toString()

  render() {
    let data = _.filter(this.props.patient.records, (o)=> {
      return o.status === this.props.status
    })
    return (
      <View style={styles.container}>
        <SearchBar
        onCancel={()=>this.onHandleChange('','searchNameAndHospitl')}
        onSubmit={value => this.onSearch('searchNameAndHospitl','nameAndHospital')}
        onChange={(e)=>this.onHandleChange(e,'searchNameAndHospitl')} value={this.state.searchNameAndHospitl} placeholder="Search Name/Hospital" />

        <SearchBar
        onCancel={()=>this.onHandleChange('','searchDischarge')}
        onSubmit={value => this.onSearch('searchDischarge','date_discharge')}
        onChange={(e)=>this.onHandleChange(e,'searchDischarge')} value={this.state.searchDischarge} placeholder="Date Discharge" />

        <SearchBar
        onCancel={()=>this.onHandleChange('','searchAdmitted')}
        onSubmit={value => this.onSearch('searchAdmitted','date_admitted')}
        onChange={(e)=>this.onHandleChange(e,'searchAdmitted')} value={this.state.searchAdmitted} placeholder="Date Admitted" />

        <FlatList
          data={data}
          renderItem={({ item }) => this.renderItem(item)}
          keyExtractor={this._keyExtractor}
        />

        <Button onClick={this.gotoNew} style={{backgroundColor:'#21b68a'}}>
          <Text style={{color:'white'}}>New Patient</Text>
        </Button>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default PatientList
