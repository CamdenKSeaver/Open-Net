
describe('OpenNet App Tests', () =>{

    beforeEach(() =>{
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    describe('Sign Up',() =>{
        it('should create new user and store token', async() =>{
        const {signUpWithEmail }= require('../src/services/authService');
        
        global.fetch.mockResolvedValueOnce({
            json: async() =>({
            success: true,
            data: {
                token: 'test-token-123',
                user: {id: 'user-1', email: 'test@test.com' }
            }
            })
        });

        await signUpWithEmail('test@test.com', 'password123', 'Test User');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/signup'),
            expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'password123',
                name: 'Test User'
            })
            })
        );
        expect(global.AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token-123');
        });

        it('should handle profile image selection', async () => {

            const mockImagePicker = {
                launchImageLibraryAsync: jest.fn(() =>Promise.resolve({
                cancelled: false,
                uri: 'file://test-image.jpg'
                }))
            };
            
            jest.mock('expo-image-picker', () =>mockImagePicker);
            
            const {createUserProfile }= require('../src/services/profileService');
            
            global.AsyncStorage.getItem.mockResolvedValue('test-token');
            
            global.fetch.mockResolvedValueOnce({
                json:async() => ({
                success:true,
                data:{
                    id:'user-1',
                    name:'Test User',
                    profile_image_url:'https://example.com/image.jpg'
                }
                })
            });

            const profileData = {
                uid:'user-1',
                name: 'Test User',
                email: 'test@test.com',
                primaryPosition: 'Setter',
                location:'San Francisco',
                preferredCourts:['beach'],
                experienceLevel:'beginner',
                profileImage: 'file://test-image.jpg'
            };

            const result = await createUserProfile(profileData);

            expect(result.profile_image_url).toBe('file://test-image.jpg');
            
        });
    });

    describe('Sign In', () => {
        it('should login user and store token', async () =>{
        const {signInWithEmail }= require('../src/services/authService');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data: {
                token: 'signin-token-456',
                user: {id:'user-1', email:'test@test.com' }
            }
            })
        });
        await signInWithEmail('test@test.com', 'password123');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/signin'),
            expect.objectContaining({
            method:'POST',
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'password123'
            })
            })
        );
        expect(global.AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'signin-token-456');
        });
    });

    describe('Create Profile', () =>{
        it('should create user profile with all required fields', async () =>{
        const {createUserProfile }= require('../src/services/profileService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data: {
                id: 'user-1',
                name: 'Test User',
                primary_position:'Setter'
            }
            })
        });

        const profileData = {
            uid:'user-1',
            name:'Test User',
            email:'test@test.com',
            primaryPosition:'Setter',
            location:'San Francisco',
            preferredCourts:['beach'],
            experienceLevel:'beginner'
        };

        const result = await createUserProfile(profileData);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/profiles'),
            expect.objectContaining({
            method: 'POST'
            })
        );
        expect(result.name).toBe('Test User');
        });
    });

    describe('Update Profile', () =>{
        it('should update user profile', async () =>{

        const {updateUserProfile }= require('../src/services/profileService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data:{
                id: 'user-1',
                name: 'Updated Name',
                bio:'New bio'
            }
            })

        });
        const updates = {
            name:'Updated Name',
            bio: 'New bio'
        };


        const result = await updateUserProfile('user-1', updates);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/profiles/user-1'),
            expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updates)
            })
        );
        expect(result.name).toBe('Updated Name');
        });
    });

    describe('Create Event',() => {

        it('should create volleyball event', async() =>{
        const {createEvent }= require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json:async() =>({
            success: true,
            data: {
                id:'event-1',
                title: 'Beach Volleyball',
                max_players: 8
            }
            })
        });




        const eventData = {
            title: 'Beach Volleyball',
            courtType:'beach',
            maxPlayers: 8,
            hostId: 'user-1',
            hostName: 'Test User',
            location: {latitude: 37.7749, longitude:-122.4194 },
            dateTime:{
            startTime:new Date('2025-12-20'),
            endTime:new Date('2025-12-20')
            }
        };

        const result = await createEvent(eventData);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/events'),
            expect.objectContaining({
            method:'POST'
            })
        );
        expect(result.title).toBe('Beach Volleyball');

        
        });


        it('should reject event creation with past date', async() => {
        const {createEvent } = require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        

        global.fetch.mockResolvedValueOnce({
            json:async () =>({
            success: false,
            error: 'Event date cannot be in the past'
            })
        });

        const pastEvent = {
            title: 'Beach Volleyball',
            courtType: 'beach',
            maxPlayers: 8,
            hostId: 'user-1',
            hostName: 'Test',
            location: {latitude: 37.7749, longitude: -122.4194 },
            dateTime: {
                startTime: new Date('1900-01-01'),
                endTime: new Date('1900-01-01')
            }
        };
        await expect(createEvent(pastEvent)).rejects.toThrow();
        });
    });
    describe('Search Events', () => {
        it('should get events in area', async () =>{
        const {getEventsInArea }= require('../src/services/eventService');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data: [
                {id: 'event-1', title: 'Beach Volleyball' },
                {id: 'event-2', title: 'Indoor Match' }
            ]
            })
        });

        const center = {latitude: 37.7749, longitude: -122.4194 };
        const events = await getEventsInArea(center, 50);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/events')
        );
        expect(events).toHaveLength(2);
        expect(events[0].title).toBe('Beach Volleyball');
        });
    });




    describe('Join Event', () => {


        it('should join event waitlist', async () => {
        const {joinEventWaitlist }= require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data: {
                event_id: 'event-1',
                user_id: 'user-1',
                status: 'approved'
            }

            })

        });

        const result = await joinEventWaitlist('event-1', 'user-1');
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/events/event-1/join'),
            expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({userId: 'user-1' })
            })
        );



        expect(result.status).toBe('approved');
        });


        it('should prevent duplicate event joins', async () => {
        const {joinEventWaitlist }= require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data: {event_id: 'event-1', user_id: 'user-1', status: 'approved' }
            })
        });
        
        await joinEventWaitlist('event-1', 'user-1');
        
        global.fetch.mockResolvedValueOnce({
            json: async() =>({
            success: false,
            error: 'Already joined this event'
            })
        });
        await expect(joinEventWaitlist('event-1', 'user-1')).rejects.toThrow();
        });
    });
    describe('Join Waitlist',() => {


        it('should add user to waitlist when event is full', async () =>{
        const {joinEventWaitlist }= require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
            success: true,
            data: {
                event_id: 'event-1',
                user_id: 'user-2',
                status: 'waitlist'
            }
            })


        });

        const result = await joinEventWaitlist('event-1', 'user-2');

        expect(result.status).toBe('waitlist');
        });
    });

    describe('Accept Player',() => {

        it('should approve player from waitlist', async() =>{
        const {approvePlayer }= require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        
        global.fetch.mockResolvedValueOnce({
            json: async() =>({
            success: true
            })
        });

        await approvePlayer('event-1', 'user-2', 'host-user');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/events/event-1/approve'),
            expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                userId: 'user-2',

                hostId: 'host-user'
            })
            })
        );


        });

    });




    describe('Leave Event', () => {


        it('should remove user from event', async () =>{
        const {leaveEvent }= require('../src/services/eventService');
        
        global.AsyncStorage.getItem.mockResolvedValue('test-token');
        global.fetch.mockResolvedValueOnce({
            json: async () =>({
                success: true
            })

        });


        await leaveEvent('event-1', 'user-1');


        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/events/event-1/leave'),expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({userId: 'user-1' })
            })
        );
        });
    });

});