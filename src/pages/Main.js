import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, View, Text, TextInput, TouchableOpacity } from 'react-native'
import MapView, { Marker, Callout } from 'react-native-maps';
import { requestPermissionsAsync, getCurrentPositionAsync } from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../services/api';
import { connect, disconnect, subscribeToNewDevs } from '../services/socket';

function Main({ navigation }) {
    const [devs, setDevs] = useState([]);
    const [devLocation, setDevLocation] = useState(null);
    const [techs, setTechs] = useState('');
    //dentro do useEffet é passada uma função a qual você deseja excutar, 
    //como segundo paramêtro é passado um array vazio que excuta apenas uma vez
    useEffect(() => {
        async function loadInitialPosition() {
            const { granted } = await requestPermissionsAsync();
            if (granted) {
                const { coords } = await getCurrentPositionAsync({
                    enableHighAccuracy: true,
                });

                const { latitude, longitude } = coords;
                setDevLocation({
                    latitude,
                    longitude,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                })

            }
        }
        loadInitialPosition();
    }, []);

    useEffect(() => {
        subscribeToNewDevs(dev => setDevs([...devs, dev]));
    }, [devs])

    function setupWebSocket() {

        disconnect();
        const { latitude, longitude } = devLocation;
        connect(latitude, longitude, techs);
    }

    async function loadDevs() {
        const { latitude, longitude } = devLocation;
        const response = await api.get('/search', {
            params: {
                latitude,
                longitude,
                techs
            }
        });
        setDevs(response.data.devs);
        setupWebSocket();
    }

    function handleRegionChange(region) {
        setDevLocation(region);
    }

    if (!devLocation) {
        return null;
    }
    return (
        <>
            <MapView
                onRegionChangeComplete={handleRegionChange} initialRegion={devLocation} style={styles.map}>
                {devs.map(dev => (
                    <Marker
                        key={dev._id}
                        coordinate={{
                            latitude: dev.location.coordinates[1],
                            longitude: dev.location.coordinates[0]
                        }}>
                        <Image style={styles.avatar} source={{ uri: dev.avatar_url }}></Image>
                        <Callout onPress={() => {
                            //executar a navegação
                            navigation.navigate('Profile', { github_username: dev.github_username })
                        }}>
                            <View style={styles.callout}>
                                <Text style={styles.devName}>{dev.name}</Text>
                                <Text style={styles.devBio}>{dev.bio}</Text>
                                <Text style={styles.devTechs}>{dev.techs.join(", ")}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            <View style={styles.searchForm}>
                <TextInput
                    style={styles.searchFormInput}
                    placeholder="Buscar Devs por tecnologias"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={techs}
                    onChangeText={text => setTechs(text)}
                ></TextInput>

                <TouchableOpacity onPress={loadDevs} style={styles.loadButton}>
                    <MaterialIcons name="my-location" size={20} color="#fff"></MaterialIcons>
                </TouchableOpacity>
            </View>
        </>

    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },

    avatar: {
        width: 54,
        height: 54,
        borderRadius: 4,
        borderWidth: 4,
        borderColor: '#fff',
    },

    callout: {
        width: 260,
    },

    devName: {
        fontWeight: 'bold',
        fontSize: 16,
    },

    devBio: {
        color: '#666',
        marginTop: 5
    },

    devTechs: {
        marginTop: 5
    },

    searchForm: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        zIndex: 5,
        flexDirection: "row",
    },

    searchFormInput: {
        flex: 1,
        height: 50,
        backgroundColor: "#fff",
        color: "#333",
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 4,
            height: 4
        },
        elevation: 2,

    },

    loadButton: {
        width: 50,
        height: 50,
        backgroundColor: "#8e4dff",
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 15
    }

})

export default Main;