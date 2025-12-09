import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { getUserEvents } from '../services/eventService'


const MyEventsScreen = () => {

  const navigation = useNavigation()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [eventFilter, setEventFilter] = useState('all')
  const [events, setEvents] = useState({ hosted: [], joined: [] })



  useFocusEffect(
    React.useCallback(() => {
        loadEvents()
    }, [user])
  )



  const loadEvents = async () => {
      try {
        if(!user?.id && !user?.uid){
          setLoading(false)
          return
        }

        const userId = user.id || user.uid
        const eventsData = await getUserEvents(userId)

        setEvents(eventsData)

      } catch (error) {
        Alert.alert('Error','Failed to load your events')
      }
      finally {
        setLoading(false)
        setRefreshing(false)
      }
  }



  const handleRefresh = () => {
      setRefreshing(true)
      loadEvents()
  }



  const getCourtIcon = (courtType) => {
      const icons = {
        beach: 'beach-access',
        indoor: 'home',
        grass: 'grass'
      }
      return icons[courtType] || 'sports-volleyball'
  }


  const getCourtColor = (courtType) => {
      const colors = {
        beach: '#FFB800',
        indoor: '#FB923C',
        grass:'#10B981'
      }

      return colors[courtType] || '#6366F1'
  }

const getFilterCounts = () => {



  const now = new Date()
  
  const filterByTab = (eventsList) => {
    return eventsList.filter(event => {
      const eventDate = new Date(event.start_time)
      if (activeTab === 'upcoming') {
        return eventDate >= now && event.status === 'active'
      } else {
        return eventDate < now || event.status === 'cancelled'
      }
    })
  }

  const filteredHosted = filterByTab(events.hosted)
  const filteredJoined = filterByTab(events.joined)



  return {
    all: filteredHosted.length + filteredJoined.length,
    hosting:filteredHosted.length,

    joined: filteredJoined.length
  }
}

  const filterEvents = () => {
    const now = new Date()
    let allEvents = []


    if(eventFilter === 'all'){
      allEvents = [
        ...events.hosted.map(e => ({...e, isHost:true})),
        ...events.joined.map(e => ({...e, isHost:false}))
      ]
    } else if(eventFilter === 'hosting'){
      allEvents = events.hosted.map(e => ({...e, isHost:true}))
    } else {
      allEvents = events.joined.map(e => ({...e, isHost:false}))
    }


    const filtered = allEvents.filter(ev => {
        const eventDate = new Date(ev.start_time)

        if(activeTab === 'upcoming'){
          return (eventDate >= now && ev.status === 'active')
        }
        return (eventDate < now || ev.status === 'cancelled')
    })


    return filtered.sort((a,b) => {
        const da = new Date(a.start_time)
        const db = new Date(b.start_time)

        return activeTab === 'upcoming' ? da-db : db-da
    })
  }





  const renderEventCard = (event) => {

    const eventDate = new Date(event.start_time)
    const isCancelled = event.status === 'cancelled'
    const isPast = eventDate < new Date()


    return (
      <TouchableOpacity
        key ={event.id}
        style = {[
          styles.eventCard,
          isCancelled && styles.eventCardCancelled,
          isPast && !isCancelled && styles.eventCardPast
        ]}
        onPress = {() => navigation.navigate('EventDetail',{eventId:event.id})}
        activeOpacity = {.7}
      >

        <View style = {styles.eventCardHeader}>

          <View style = {styles.eventCardLeft}>

              <View style= {[
                styles.courtIcon,
                { backgroundColor:getCourtColor(event.court_type) }
              ]}>

                <MaterialIcons name= {getCourtIcon(event.court_type)} size= {24} color="#fff" />

              </View>

              <View style= {styles.eventTitleContainer}>
                <Text numberOfLines = {1} style = {styles.eventTitle}>
                  {event.title}
                </Text>


                <View style = {styles.eventMetaRow}>

                    {event.isHost && (
                      <View style ={styles.hostBadge}>
                        <MaterialIcons name="star" size ={12} color="#FB923C"/>
                        <Text style ={styles.hostBadgeText}>Hosting</Text>
                      </View>
                    )}

                    {event.is_private && (
                      <View style={styles.privateBadge}>
                        <MaterialIcons name="lock" size= {12} color="#6B7280"/>
                        <Text style= {styles.privateBadgeText}>Private</Text>
                      </View>
                    )}

                </View>

              </View>

          </View>


          {isCancelled && (
            <View style= {styles.cancelledBadge}>
              <Text style= {styles.cancelledBadgeText}>CANCELLED</Text>
            </View>
          )}

        </View>



        <View style= {styles.eventCardBody}>

          <View style = {styles.eventInfoRow}>
            <MaterialIcons name="event" size = {16} color="#6B7280"/>
            <Text style = {styles.eventInfoText}>
              {eventDate.toLocaleDateString('en-US',{
                weekday:'short', month:'short', day: 'numeric'
              })}
            </Text>
          </View>


          <View style = {styles.eventInfoRow}>
            <MaterialIcons name="schedule" size = {16} color="#6B7280"/>
            <Text style = {styles.eventInfoText}>
              {eventDate.toLocaleTimeString([],{
                hour: '2-digit', minute:'2-digit'
              })}
            </Text>
          </View>


          <View style= {styles.eventInfoRow}>
            <MaterialIcons name="people" size= {16} color="#6B7280"/>
            <Text style= {styles.eventInfoText}>
              {event.current_players} / {event.max_players} Players
            </Text>
          </View>

        </View>



        {event.location_address && (
          <View style= {styles.eventCardFooter}>
            <MaterialIcons name="place" size={14} color="#9CA3AF"/>
            <Text numberOfLines={1} style={styles.locationText}>
              {event.location_address}
            </Text>
          </View>
        )}

      </TouchableOpacity>
    )
  }






  const renderEmptyState = () => {

    let title
    let message

    if(eventFilter === 'hosting'){
      title = activeTab==='upcoming' ? "You're Not Hosting Any Events" : "No Past Events"
      message = activeTab==='upcoming'
        ? "Create your first event to get started!"
        : "You haven't hosted any events yet."
    } 
    else if(eventFilter === 'joined'){
      title = activeTab==='upcoming' ? "You Haven't Joined Any Events" : "No Past Events"
      message = activeTab==='upcoming'
        ? "Find and join events on the map!"
        : "You haven't joined any events yet."
    }
    else {
      title = activeTab==='upcoming' ? "No Upcoming Events" : "No Past Events"
      message = activeTab==='upcoming'
        ? "Create or join an event to get started!"
        : "You don't have any past events yet."
    }



    return (
      <View style = {styles.emptyState}>

        <MaterialIcons
          name = {activeTab==='upcoming' ? 'event-available' : 'history'}
          size = {64}
          color="#D1D5DB"
        />

        <Text style = {styles.emptyStateTitle}>{title}</Text>
        <Text style = {styles.emptyStateText}>{message}</Text>


        {activeTab === 'upcoming' && (
          <TouchableOpacity
            style = {styles.createButton}
            onPress ={() => navigation.navigate('CreateEvent')}
          >
            <MaterialIcons name="add" size={20} color="#fff"/>
            <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        )}

      </View>
    )
  }





  const filteredEvents = filterEvents()

  const filterCounts = getFilterCounts()

  if(loading){
    return (
      <SafeAreaView style={styles.container}>

        <View style ={styles.header}>
          <Text style = {styles.headerTitle}>My Events</Text>
        </View>

        <View style = {styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C"/>
        </View>

      </SafeAreaView>
    )
  }





  return (
    <SafeAreaView style= {styles.container}>

      <View style= {styles.header}>
        <Text style= {styles.headerTitle}>My Events</Text>
      </View>


      <View style = {styles.tabContainer}>

        <TouchableOpacity
          style = {[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress = {() => setActiveTab('upcoming')}
        >
          <Text style = {[styles.tabText, activeTab==='upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>


        <TouchableOpacity
          style = {[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab==='past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>

      </View>




      <View style = {styles.filterContainer}>

        <TouchableOpacity
          onPress ={() => setEventFilter('all')}
          style ={[
            styles.filterButton,
            eventFilter ==='all' && styles.filterButtonActive
          ]}
        >
          <Text
            style ={[
              styles.filterButtonText,
              eventFilter === 'all' && styles.filterButtonTextActive
            ]}
          >
            All ({filterCounts.all})
          </Text>
        </TouchableOpacity>



        <TouchableOpacity
          onPress ={() => setEventFilter('hosting')}
          style ={[
            styles.filterButton,
            eventFilter === 'hosting' && styles.filterButtonActive
          ]}
        >
          <MaterialIcons
            name="star" size ={16}
            color= {eventFilter === 'hosting' ? '#FB923C' : '#6B7280'}
          />

          <Text style= {[
            styles.filterButtonText,
            eventFilter ==='hosting' && styles.filterButtonTextActive
          ]}>
            Hosting ({filterCounts.hosting})
          </Text>

        </TouchableOpacity>




        <TouchableOpacity
          onPress= {() => setEventFilter('joined')}
          style= {[
            styles.filterButton,
            eventFilter ==='joined' && styles.filterButtonActive
          ]}
        >
          <MaterialIcons
            name="check-circle"
            size= {16}
            color= {eventFilter ==='joined' ? '#10B981' : '#6B7280'}
          />

          <Text style= {[
            styles.filterButtonText,
            eventFilter ==='joined' && styles.filterButtonTextActive
          ]}>Joined ({filterCounts.joined})
          </Text>

        </TouchableOpacity>

      </View>





      <ScrollView
        style= {styles.content}
        contentContainerStyle= {styles.scrollContent}
        showsVerticalScrollIndicator= {false}
        refreshControl= {
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FB923C']}
          />
        }
      >

        {filteredEvents.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map(ev => renderEventCard(ev))}
          </View>
        )}

      </ScrollView>


    </SafeAreaView>
  )
}








const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:'#F9FAFB'
  },

  header:{
    paddingHorizontal:16,
    paddingVertical:16,
    backgroundColor: '#fff',
    borderBottomWidth:1,
    borderBottomColor: '#E5E7EB'
  },

  headerTitle:{
    fontSize:28,
    fontWeight: '700',
    color: '#111827'
  },

  loadingContainer:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },



  tabContainer:{
    flexDirection:'row',
    backgroundColor: '#fff',
    paddingHorizontal:16,
    paddingTop: 8,
    paddingBottom:12,
    borderBottomWidth:1,
    borderBottomColor:'#E5E7EB'
  },

  tab:{
    flex:1,
    paddingVertical:12,
    alignItems:'center',
    borderBottomWidth:3,
    borderBottomColor:'transparent'
  },

  activeTab:{borderBottomColor: '#FB923C' },

  tabText:{
    fontSize:16,
    fontWeight:'600',
    color:'#6B7280'
  },

  activeTabText:{ color:'#FB923C' },





  filterContainer:{
    flexDirection:'row',
    paddingHorizontal:16,
    paddingVertical:12,
    gap:8,
    backgroundColor:'#fff'
  },

  filterButton:{
    flexDirection:'row',
    alignItems: 'center',
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:20,
    backgroundColor:'#F3F4F6',
    gap:4
  },

  filterButtonActive:{
    backgroundColor:'#FFF7ED',
    borderWidth: 1,
    borderColor: '#FB923C'
  },

  filterButtonText:{
    fontSize:14,
    fontWeight:'500',
    color:'#6B7280'
  },

  filterButtonTextActive:{color:'#FB923C' },




  content:{flex:1},

  scrollContent:{padding:16 },

  eventsList:{gap:12 },



  eventCard:{
    backgroundColor: '#fff',
    borderRadius:12,
    padding:16,
    shadowColor: '#000',
    shadowOffset:{width:0, height:2},
    shadowOpacity:.1,
    shadowRadius:3,
    elevation:2
  },

  eventCardCancelled:{
    opacity:.6,
    borderWidth:2,
    borderColor: '#FEE2E2'
  },

  eventCardPast:{ opacity:.8 },



  eventCardHeader:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'flex-start',
    marginBottom:12
  },

  eventCardLeft:{
    flexDirection: 'row',
    flex:1,
    gap:12
  },

  courtIcon:{
    width:48,
    height:48,
    borderRadius:12,
    alignItems: 'center',
    justifyContent: 'center'
  },

  eventTitleContainer:{ flex:1, justifyContent: 'center' },

  eventTitle:{
    fontSize:18,
    fontWeight: '700',
    color: '#111827',
    marginBottom:4
  },

  eventMetaRow:{
    flexDirection:'row',
    gap:6
  },

  hostBadge:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal:8,
    paddingVertical:2,
    borderRadius:8,
    gap:4
  },

  hostBadgeText:{
    fontSize:12,
    fontWeight: '600',
    color: '#FB923C'
  },

  privateBadge:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal:8,
    paddingVertical:2,
    borderRadius:8,
    gap:4
  },

  privateBadgeText:{
    fontSize:12,
    fontWeight: '600',
    color: '#6B7280'
  },

  cancelledBadge:{
    backgroundColor: '#FEE2E2',
    paddingHorizontal:10,
    paddingVertical:4,
    borderRadius:8
  },

  cancelledBadgeText:{
    fontSize:11,
    fontWeight: '700',
    color: '#EF4444'
  },



  eventCardBody:{
    flexDirection: 'row',
    gap:16,
    marginBottom:12
  },

  eventInfoRow:{
    flexDirection: 'row',
    alignItems:'center',
    gap:6
  },

  eventInfoText:{
    fontSize:14,
    color:'#374151',
    fontWeight:'500'
  },



  eventCardFooter:{
    flexDirection:'row',
    alignItems: 'center',
    gap:6,
    paddingTop:12,
    borderTopWidth:1,
    borderTopColor: '#F3F4F6'
  },

  locationText:{
    fontSize:13,
    color: '#6B7280',
    flex:1
  },




  emptyState:{
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:80,
    paddingHorizontal:32
  },

  emptyStateTitle:{
    fontSize:20,
    fontWeight: '600',
    color: '#111827',
    marginTop:16,
    marginBottom:8,
    textAlign: 'center'
  },

  emptyStateText:{
    fontSize:15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight:22,
    marginBottom:24
  },



  createButton:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:'#FB923C',
    paddingHorizontal:20,
    paddingVertical:12,
    borderRadius:12,
    gap:8
  },

  createButtonText:{
    color:'#fff',
    fontSize:16,
    fontWeight: '600'
  }

})



export default MyEventsScreen
