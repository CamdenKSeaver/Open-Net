import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Image
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { useAuth } from '../context/AuthContext'
import {
  getEvent,
  joinEventWaitlist,
  leaveEvent,
  cancelEvent,
  getEventPlayers,
  updatePlayerPosition
} from '../services/eventService'

import PlayerCard from '../components/PlayerCard'
import PositionSelector from '../components/PositionSelector'


// colors I grabbed earlier since my original ones looked awful lol
const POSITION_COLORS = {
  'Setter': '#6366F1',
  'Outside Hitter': '#EF4444',
  'Middle Blocker': '#F59E0B',
  'Opposite': '#10B981',
  'Libero': '#8B5CF6',
  'Defensive Specialist': '#EC4899',
  'Unassigned': '#6B7280',
};


const EventDetailScreen = ({ route, navigation }) => {

  const { eventId } = route.params
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [players, setPlayers] = useState({ approved: [], waitlist: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [showPositionSelector, setShowPositionSelector] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [selectedPlayerPosition, setSelectedPlayerPosition] = useState(null)



  useEffect(() => {
    loadEventDetails()
  }, [eventId])


  const loadEventDetails = async () => {
    try {
      const eventData = await getEvent(eventId)
      setEvent(eventData)

      const playerData = await getEventPlayers(eventId)
      setPlayers(playerData)

    } catch (err) {
      Alert.alert('Error', 'Failed to load event details')
      navigation.goBack()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  const handleRefresh = () => {
    setRefreshing(true)
    loadEventDetails()
  }



  const handleJoinEvent = async () => {
    try {
      setActionLoading(true)

      if (event.is_private) {

        Alert.alert(
          'Join Waitlist',
          'This is an invite-only event. You will be added to the waitlist and the host will review your request.',
          [
            { text: 'Cancel', style:'cancel' },

            {
              text: 'Join Waitlist',
              onPress: async () => {
                try {
                  await joinEventWaitlist(event.id, user.id)
                  Alert.alert('Success', 'You have been added to the waitlist. The host will review your request.')
                  navigation.goBack()
                } catch (error) {
                  Alert.alert('Error', error.message)
                }
              }
            }
          ]
        )

        setActionLoading(false)
        return
      }


      await joinEventWaitlist(event.id, user.id)

      const isFull = event.current_players >= event.max_players

      if (isFull) {
        Alert.alert('Joined Waitlist', 'Event is full. You have been added to the waitlist.')
      } else {
        Alert.alert('Success', 'You have joined the event!')
      }

      navigation.goBack()

    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to join event')

    } finally {
      setActionLoading(false)
    }
  }



  const handleLeaveEvent = async () => {

    Alert.alert(
      'Leave Event?',
      'Are you sure you want to leave this event?',
      [
        { text:'Cancel', style:'cancel' },

        {
          text:'Leave',
          style:'destructive',
          onPress: async () => {
            setActionLoading(true)

            try {
              await leaveEvent(eventId, user.id)
              Alert.alert('Left Event', 'You have left this event.')
              navigation.goBack()

            } catch (error) {
              Alert.alert('Error', error.message)

            } finally {
              setActionLoading(false)
            }
          }
        }
      ]
    )
  }



  const handleCancelEvent = async () => {

    Alert.alert(
      'Cancel Event?',
      'Are you sure? All players will be notified.',
      [
        { text:'No', style:'cancel' },

        {
          text:'Yes, Cancel',
          style:'destructive',
          onPress: async () => {
            setActionLoading(true)

            try {
              await cancelEvent(eventId, 'Cancelled by host')
              Alert.alert('Event Cancelled', 'The event has been cancelled.')
              navigation.goBack()

            } catch (error) {
              Alert.alert('Error', error.message)

            } finally {
              setActionLoading(false)
            }
          }
        }
      ]
    )
  }



  const handleChangePosition = (playerId, currentPosition) => {
    setSelectedPlayerId(playerId)
    setSelectedPlayerPosition(currentPosition)
    setShowPositionSelector(true)
  }


  const handlePositionSelect = async (newPosition) => {
    try {
      await updatePlayerPosition(eventId, selectedPlayerId, newPosition, user.id)
      setShowPositionSelector(false)
      loadEventDetails()

    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }


  const groupPlayersByPosition = (players) => {

    const positions = {
      'Setter': [],
      'Outside Hitter': [],
      'Middle Blocker': [],
      'Opposite': [],
      'Libero': [],
      'Defensive Specialist': [],
      'Unassigned': [],
    }

    players.forEach(p => {
      const spot = p.position || 'Unassigned'
      positions[spot] ? positions[spot].push(p) : positions['Unassigned'].push(p)
    })

    return Object.entries(positions).filter(([_, list]) => list.length > 0)
  }



  const getCourtIcon = (courtType) => {
    const icons = {
      'beach': 'beach-access',
      'indoor': 'home',
      'grass': 'grass',
    }
    return icons[courtType] || 'sports-volleyball'
  }


  const getCourtColor = (courtType) => {
    const colors = {
      'beach': '#FFB800',
      'indoor': '#FB923C',
      'grass': '#10B981',
    }
    return colors[courtType] || '#6366F1'
  }




  if (loading) {
    return (
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>

      </SafeAreaView>
    )
  }



  if (!event) {
    return (
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827"/>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
        </View>

        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Event not found</Text>
        </View>

      </SafeAreaView>
    )
  }



  const isHost      = event.host_id === user?.id
  const isApproved  = event.approved_players?.includes(user?.id)
  const isOnWaitlist = event.waitlist?.includes(user?.id)
  const isFull      = event.current_players >= event.max_players



  return (
    <SafeAreaView style={styles.container}>


      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Event Details</Text>

        {isHost && (
          <TouchableOpacity onPress={handleCancelEvent} style={styles.headerAction}>
            <MaterialIcons name="cancel" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>



      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FB923C']}
          />
        }
      >


        {/* title area */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>

            <MaterialIcons
              name={getCourtIcon(event.court_type)}
              size={32}
              color={getCourtColor(event.court_type)}
            />

            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.courtType}>
                {event.court_type.charAt(0).toUpperCase() + event.court_type.slice(1)} Court
              </Text>
            </View>

            {event.is_private && (
              <View style={styles.privateInfo}>
                <View style={styles.privateContent}>
                  <MaterialIcons name="lock" size={20} color="#FB923C" />
                  <Text style={styles.privateText}>Invite Only</Text>
                </View>
              </View>
            )}

          </View>
        </View>



        {/* player count */}
        <View style={styles.playersSection}>
          <View style={styles.playersRow}>
            <MaterialIcons name="people" size={24} color="#6B7280" />
            <Text style={styles.playersText}>{event.current_players} / {event.max_players} Players</Text>
          </View>

          {isFull && !isApproved && !isHost && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>FULL</Text>
            </View>
          )}
        </View>



        {/* date/time */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              {event.dateTime?.dateString ||
                new Date(event.start_time).toLocaleDateString(
                  'en-US',
                  { weekday:'long', year:'numeric', month:'long', day:'numeric' }
                )}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              {event.dateTime?.startTimeString ||
                new Date(event.start_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
              }
              {' - '}
              {event.dateTime?.endTimeString ||
                new Date(event.end_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
              }
            </Text>
          </View>
        </View>



        {/* description */}
        {!!event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}



        {/* map */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Location</Text>

          {event.location_address && (
            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={20} color="#FB923C" />
              <Text style={styles.addressText}>{event.location_address}</Text>
            </View>
          )}

          {event.location && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: event.location.latitude,
                    longitude: event.location.longitude
                  }}
                  pinColor={getCourtColor(event.court_type)}
                />
              </MapView>
            </View>
          )}
        </View>



        {/* host section */}
        <View style={styles.hostSection}>
          <Text style={styles.sectionTitle}>Host</Text>

          <View style={styles.hostRow}>

            {event.host?.profile_image_url ? (
              <Image source={{ uri:event.host.profile_image_url }} style={styles.hostAvatar} />

            ) : (
              <View style={styles.hostAvatarPlaceholder}>
                <MaterialIcons name="person" size={24} color="#FB923C" />
              </View>
            )}

            <Text style={styles.hostName}>{event.host?.name || event.host_name}</Text>

            {isHost && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
        </View>



        {/* players list */}
        {players.approved.length > 0 && (
          <View style={styles.playersListSection}>

            <Text style={styles.sectionTitle}>
              Players ({players.approved.length})
            </Text>

            {groupPlayersByPosition(players.approved).map(([position, list]) => (
              <View key={position} style={styles.positionGroup}>

                <View style={styles.positionHeader}>
                  <View style={[styles.positionDot, { backgroundColor:POSITION_COLORS[position] }]} />
                  <Text style={styles.positionTitle}>{position}</Text>

                  <View style={styles.positionBadge}>
                    <Text style={styles.positionBadgeText}>{list.length}</Text>
                  </View>
                </View>

                {list.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    showPosition={false}
                    canChangePosition={isHost || player.id === user.id}
                    onChangePosition={() => handleChangePosition(player.id, player.position)}
                  />
                ))}

              </View>
            ))}

          </View>
        )}



        {/* host's waitlist management */}
        {isHost && (
          <TouchableOpacity
            style={styles.waitlistButton}
            onPress={() => navigation.navigate('WaitlistManagement', { eventId:event.id })}
          >
            <MaterialIcons name="people-outline" size={20} color="#FB923C" />
            <Text style={styles.waitlistButtonText}>Manage Waitlist ({players.waitlist.length})</Text>
          </TouchableOpacity>
        )}


        <View style={{ height:100 }} />

      </ScrollView>




      {/* join/leave buttons */}
      {!isHost && (
        <View style={styles.bottomActions}>

          {isApproved ? (

            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveEvent}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />

              ) : (
                <>
                  <MaterialIcons name="exit-to-app" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Leave Event</Text>
                </>
              )}
            </TouchableOpacity>


          ) : isOnWaitlist ? (

            <View style={styles.waitlistInfo}>
              <MaterialIcons name="schedule" size={20} color="#FB923C" />
              <Text style={styles.waitlistInfoText}>You're on the waitlist</Text>
            </View>


          ) : (

            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={handleJoinEvent}
              disabled={actionLoading || isFull}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF"/>

              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {isFull ? 'Event Full' : 'Join Event'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

        </View>
      )}


      <PositionSelector
        visible={showPositionSelector}
        currentPosition={selectedPlayerPosition}
        onSelect={handlePositionSelect}
        onClose={() => setShowPositionSelector(false)}
      />


    </SafeAreaView>
  )
}




// styles (kept mostly the same)
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },

  header: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal:16,
    paddingVertical:12,
    backgroundColor:'#FFFFFF',
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  backButton: {
    padding: 4
  },

  headerTitle: {
    fontSize:18,
    fontWeight:'600',
    color:'#111827',
    flex:1,
    textAlign:'center'
  },

  headerAction: {
    padding:4
  },

  loadingContainer:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },

  loadingText:{
    marginTop:12,
    fontSize:16,
    color:'#6B7280'
  },

  errorContainer:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },

  errorText:{
    marginTop:16,
    fontSize:18,
    fontWeight:'600',
    color:'#6B7280'
  },

  content:{
    flex:1
  },

  titleSection:{
    backgroundColor:'#FFFFFF',
    padding:20,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  titleRow:{
    flexDirection:'row',
    alignItems:'center'
  },

  titleTextContainer:{
    marginLeft:12,
    flex:1
  },

  title:{
    fontSize:24,
    fontWeight:'bold',
    color:'#111827'
  },

  courtType:{
    fontSize:14,
    color:'#6B7280',
    marginTop:4
  },

  privateInfo:{
    backgroundColor:'#FFF7ED',
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:8,
    borderWidth:1,
    borderColor:'#FB923C',
    marginLeft:8
  },

  privateContent:{
    flexDirection:'row',
    alignItems:'center',
    gap: 6
  },

  privateText:{
    color:'#FB923C',
    fontWeight:'600'
  },

  playersSection:{
    backgroundColor:'#FFFFFF',
    paddingHorizontal:20,
    paddingVertical:16,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB',
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center'
  },

  playersRow:{
    flexDirection:'row',
    alignItems:'center'
  },

  playersText:{
    fontSize:16,
    fontWeight:'600',
    color:'#111827',
    marginLeft:8
  },

  fullBadge:{
    backgroundColor:'#FEE2E2',
    paddingHorizontal:12,
    paddingVertical:4,
    borderRadius:12
  },

  fullBadgeText:{
    fontSize:12,
    fontWeight:'700',
    color:'#EF4444'
  },

  infoSection:{
    backgroundColor:'#FFFFFF',
    padding:20,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  infoRow:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:12
  },

  infoText:{
    fontSize:16,
    color:'#374151',
    marginLeft:12
  },

  descriptionSection:{
    backgroundColor:'#FFFFFF',
    padding:20,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB',
    marginTop:8
  },

  sectionTitle:{
    fontSize:18,
    fontWeight:'600',
    color:'#111827',
    marginBottom:12
  },

  descriptionText:{
    fontSize:16,
    color:'#6B7280',
    lineHeight:24
  },

  locationSection:{
    backgroundColor:'#FFFFFF',
    padding:20,
    marginTop:8,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  addressRow:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:12
  },

  addressText:{
    fontSize:16,
    color:'#374151',
    marginLeft:8,
    flex:1
  },

  mapContainer:{
    height:200,
    borderRadius:12,
    overflow:'hidden',
    borderWidth:1,
    borderColor:'#E5E7EB'
  },

  map:{
    flex:1
  },

  hostSection:{
    backgroundColor:'#FFFFFF',
    padding:20,
    marginTop:8,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  hostRow:{
    flexDirection:'row',
    alignItems:'center'
  },

  hostAvatar:{
    width:48,
    height:48,
    borderRadius:24,
    marginRight:12
  },

  hostAvatarPlaceholder:{
    width:48,
    height:48,
    borderRadius:24,
    backgroundColor:'#FFF7ED',
    alignItems:'center',
    justifyContent:'center',
    marginRight:12
  },

  hostName:{
    fontSize:16,
    fontWeight:'600',
    color:'#111827',
    flex:1
  },

  youBadge:{
    backgroundColor:'#DBEAFE',
    paddingHorizontal:8,
    paddingVertical:4,
    borderRadius:8
  },

  youBadgeText:{
    fontSize:12,
    fontWeight:'700',
    color:'#3B82F6'
  },

  playersListSection:{
    backgroundColor:'#FFFFFF',
    padding:20,
    marginTop:8,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  positionGroup:{
    marginBottom:20
  },

  positionHeader:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:12,
    paddingBottom:8,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  positionDot:{
    width:12,
    height:12,
    borderRadius:6,
    marginRight:10
  },

  positionTitle:{
    flex:1,
    fontSize:16,
    fontWeight:'700',
    color:'#111827'
  },

  positionBadge:{
    backgroundColor:'#F3F4F6',
    paddingHorizontal:10,
    paddingVertical:4,
    borderRadius:12
  },

  positionBadgeText:{
    fontSize:14,
    fontWeight:'600',
    color:'#6B7280'
  },

  waitlistButton:{
    backgroundColor:'#FFF7ED',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    padding:16,
    margin:16,
    borderRadius:12,
    borderWidth:1,
    borderColor:'#FB923C'
  },

  waitlistButtonText:{
    fontSize:16,
    fontWeight:'600',
    color:'#FB923C',
    marginLeft:8
  },

  bottomActions:{
    backgroundColor:'#FFFFFF',
    padding:16,
    borderTopWidth:1,
    borderTopColor:'#E5E7EB'
  },

  actionButton:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    paddingVertical:16,
    borderRadius:12
  },

  joinButton:{
    backgroundColor:'#FB923C'
  },

  leaveButton:{
    backgroundColor:'#EF4444'
  },

  actionButtonText:{
    fontSize:16,
    fontWeight:'600',
    color:'#FFFFFF',
    marginLeft:8
  },

  waitlistInfo:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    paddingVertical:16,
    backgroundColor:'#FFF7ED',
    borderRadius:12
  },

  waitlistInfoText:{
    fontSize:16,
    fontWeight:'600',
    color:'#FB923C',
    marginLeft:8
  },

})



export default EventDetailScreen
