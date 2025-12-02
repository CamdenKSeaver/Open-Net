import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Image
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'

import {
  getEventWaitlist,
  approvePlayer,
  rejectPlayer,
  getEvent
} from '../services/eventService'



const WaitlistManagementScreen = ({ route, navigation }) => {

  const { eventId } = route.params
  const { user } = useAuth()

  const [event , setEvent]= useState(null)
  const [waitlist,setWaitlist]= useState([])
  const [loading ,setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingId , setProcessingId] = useState(null)



  useEffect(() => { loadData() }, [eventId])

  const loadData = async() => {
    try{
      const [ev, wl ] = await Promise.all([
        getEvent(eventId),
        getEventWaitlist(eventId)
      ])

      setEvent(ev)
      setWaitlist( wl )

    } catch(err){
      Alert.alert('Error','Failed to load waitlist')
    } finally {
      setLoading(false)
      setRefreshing( false )
    }
  }


  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }


  const handleApprove = async ( player ) => {

    if(event.current_players >= event.max_players ){
      Alert.alert(
        'Event Full',
        'This event is full. Remove a player or raise the limit.',
        [{ text:'OK'}]
      )
      return
    }

    Alert.alert(
      'Approve Player',
      `Add ${ player.name } to the event?`,
      [
        { text:'Cancel', style:'cancel' },
        {
          text: 'Approve',
          onPress: async()=>{
            try{
              setProcessingId(player.id)
              await approvePlayer(eventId ,player.id , user.id)
              Alert.alert('Success', `${player.name} has been added`)
              await loadData();
            } catch(err){
              Alert.alert('Error', err.message || 'Failed to approve player')
            } finally{
              setProcessingId( null )
            }
          }
        }
      ]
    )
  }


  const handleReject = async(player) => {

    Alert.alert(
      'Reject Player',
      `Remove ${player.name} from waitlist?`,
      [
        { text:'Cancel', style:'cancel' },
        {
          text:'Reject',
          style:'destructive',
          onPress: async ()=>{
            try{
              setProcessingId( player.id )
              await rejectPlayer(eventId, player.id ,user.id)
              Alert.alert('Removed', `${player.name} was removed`)
              await loadData();
            } catch(err){
              Alert.alert('Error', err.message || 'Failed to reject player')
            } finally{
              setProcessingId(null)
            }
          }
        }
      ]
    )
  }


  const getExperienceColor = lvl => {
    const c = {
      beginner:'#10B981',
      intermediate : '#F59E0B',
      advanced: '#EF4444'
    }
    return c[lvl?.toLowerCase()] || '#6B7280'
  }




  if( loading ){
    return(
      <SafeAreaView style = {styles.container}>
        <View style = {styles.loadingCenter}>
          <ActivityIndicator size="large" color="#FB923C"/>
        </View>
      </SafeAreaView>
    )
  }



  return (
    <SafeAreaView style = {styles.container}>


      <View style = {styles.header}>
        
        <TouchableOpacity
          onPress= { ()=> navigation.goBack() }
          style = {styles.backButton}
        >
          <MaterialIcons name="arrow-back" size= {24} color="#111827"/>
        </TouchableOpacity>

        <View style= {styles.headerContent}>
          <Text style= {styles.headerTitle}>Waitlist</Text>
          <Text style= {styles.headerSubtitle}>{ event?.title }</Text>
        </View>

        <View style= {{ width:40 }} />
      </View>


      <View style= { styles.statusCard }>

        <View style= {styles.statusRow}>

          <View style= { styles.statusItem }>
            <MaterialIcons name="people" siz = {24} color="#FB923C"/>
            <View>
              <Text style= {styles.statusLabel}>Current Players</Text>
              <Text style= {styles.statusValue}>
                {event.current_players}/{ event.max_players }
              </Text>
            </View>
          </View>

          <View style = {styles.statusDivider}/>

          <View style = {styles.statusItem}>
            <MaterialIcons name="schedule" size ={24} color="#F59E0B"/>
            <View>
              <Text style ={styles.statusLabel}>On Waitlist</Text>
              <Text style={styles.statusValue}>{ waitlist.length }</Text>
            </View>
          </View>

        </View>

        { event.current_players >= event.max_players && (
          <View style= {styles.fullBanner}>
            <MaterialIcons name="info" size= {16} color="#EF4444"/>
            <Text style= {styles.fullBannerText}>
              Event is full. Remove a player to approve someone.
            </Text>
          </View>
        )}

      </View>



      <ScrollView
        style= {{ flex:1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={ handleRefresh }/>
        }
      >

        { waitlist.length === 0 ? (

          <View style= {styles.emptyState}>
            <MaterialIcons name="inbox" size= {64} color="#D1D5DB"/>
            <Text style= {styles.emptyTitle}>No Players Waiting</Text>
            <Text style= {styles.emptyText}>
              { event.is_private ? "Players requesting to join appear here" : "The waitlist is empty" }
            </Text>
          </View>

        ) : (

          <View style= {styles.playerList}>

            { waitlist.map(p => (

              <View key= {p.id} style= {styles.playerCard}>

                <View style= {styles.playerInfo}>

                  <View style={styles.playerAvatar}>
                    {p.profile_image_url
                      ? <Image source = {{ uri:p.profile_image_url }} style = {styles.avatarImage}/>
                      : <MaterialIcons name="person" size = {32} color="#FB923C"/>}
                  </View>

                  <View style = {styles.playerDetails}>

                    <Text style= {styles.playerName}>{ p.name }</Text>

                    <View style= {styles.playerMeta}>

                      <View style= {styles.metaItem}>
                        <MaterialIcons name="sports-volleyball" siz = {16} color="#6B7280"/>
                        <Text style= {styles.metaText}>{ p.primary_position }</Text>
                      </View>

                      <View style= {[
                        styles.experienceBadge,
                        { backgroundColor:getExperienceColor(p.experience_level)+'20' }
                      ]}>
                        <Text style ={[
                          styles.experienceText,
                          { color:getExperienceColor(p.experience_level) }
                        ]}>
                          { p.experience_level }
                        </Text>
                      </View>

                    </View>

                    <Text style ={styles.joinedText}>
                      Requested { new Date(p.joinedAt).toLocaleDateString() }
                    </Text>

                  </View>

                </View>



                <View style={styles.playerActions}>

                  <TouchableOpacity
                    style= {[styles.actionButton,styles.rejectButton]}
                    onPress= {()=> handleReject(p)}
                    disabled= {processingId === p.id}
                  >
                    { processingId===p.id
                      ? <ActivityIndicator size="small" color="#EF4444"/>
                      : <MaterialIcons name="close" siz = {20} color="#EF4444"/> }
                  </TouchableOpacity>


                  <TouchableOpacity
                    style= {[styles.actionButton,styles.approveButton]}
                    onPress ={()=> handleApprove(p)}
                    disabled ={processingId===p.id}
                  >
                    { processingId===p.id
                      ? <ActivityIndicator size="small" color="#FFF"/>
                      : <MaterialIcons name="check" size = {20} color="#FFF"/> }
                  </TouchableOpacity>

                </View>

              </View>

            ))}

          </View>

        )}

      </ScrollView>

    </SafeAreaView>
  )
}





const styles = StyleSheet.create({

  container:{ flex:1, backgroundColor:'#F9FAFB' },

  loadingCenter:{ flex:1, justifyContent:'center', alignItems:'center' },

  header:{
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:16,
    paddingVertical:12,
    backgroundColor:'#FFF',
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  backButton:{ padding:8 },

  headerContent:{ flex:1, marginLeft:8 },

  headerTitle:{ fontSize:18, fontWeight:'700', color:'#111827' },

  headerSubtitle:{ fontSize:14, color:'#6B7280', marginTop:2 },

  statusCard:{
    backgroundColor:'#FFF',
    margin:16,
    padding:16,
    borderRadius:12,
    elevation:2
  },

  statusRow:{ flexDirection:'row', alignItems:'center' },

  statusItem:{ flex:1, flexDirection:'row', alignItems:'center', gap:12 },

  statusLabel:{ fontSize:12, color:'#6B7280' },

  statusValue:{ fontSize:20, fontWeight:'700', color:'#111827' },

  statusDivider:{ width:1, height:40, backgroundColor:'#E5E7EB', marginHorizontal:16 },

  fullBanner:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#FEF2F2',
    padding:12,
    borderRadius:8,
    gap:8,
    marginTop:12
  },

  fullBannerText:{ flex:1, color:'#EF4444', fontSize:13, fontWeight:'500' },

  emptyState:{
    alignItems:'center',
    paddingVertical:80,
    paddingHorizontal:32
  },

  emptyTitle:{ fontSize:18, fontWeight:'600', color:'#111827', marginTop:16 },

  emptyText:{ fontSize:14, color:'#6B7280', textAlign:'center', marginTop:8 },

  playerList:{ padding:16 },

  playerCard:{
    backgroundColor:'#FFF',
    padding:16,
    borderRadius:12,
    marginBottom:12,
    elevation:2
  },

  playerInfo:{ flexDirection:'row', marginBottom:16 },

  playerAvatar:{
    width:56, height:56,
    borderRadius:28,
    backgroundColor:'#FFF7ED',
    justifyContent:'center',
    alignItems:'center',
    marginRight:12
  },

  avatarImage:{ width:56, height:56, borderRadius:28 },

  playerDetails:{ flex:1 },

  playerName:{ fontSize:16, fontWeight:'600', marginBottom:6, color:'#111827' },

  playerMeta:{ flexDirection:'row', alignItems:'center', gap:8 },

  metaItem:{ flexDirection:'row', alignItems:'center', gap:4 },

  metaText:{ fontSize:13, color:'#6B7280' },

  experienceBadge:{
    paddingHorizontal:8,
    paddingVertical:2,
    borderRadius:12
  },

  experienceText:{ fontSize:11, fontWeight:'600' },

  joinedText:{ fontSize:12, color:'#9CA3AF', marginTop:4 },

  playerActions:{ flexDirection:'row', gap:12 },

  actionButton:{
    flex:1,
    paddingVertical:12,
    borderRadius:8,
    alignItems:'center',
    justifyContent:'center'
  },

  rejectButton:{
    backgroundColor:'#FEF2F2',
    borderWidth:1,
    borderColor:'#FEE2E2'
  },

  approveButton:{
    backgroundColor:'#FB923C'
  }

})



export default WaitlistManagementScreen
