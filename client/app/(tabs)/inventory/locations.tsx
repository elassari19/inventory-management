import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  FAB,
  Card,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { gql, useMutation, useQuery } from '@apollo/client';

const GET_LOCATIONS = gql`
  query GetLocations {
    locations {
      id
      name
      description
      itemCount
    }
  }
`;

const CREATE_LOCATION = gql`
  mutation CreateLocation($input: LocationInput!) {
    createLocation(input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: String!) {
    deleteLocation(id: $id)
  }
`;

export default function LocationsScreen() {
  const router = useRouter();
  const { data, loading, refetch } = useQuery(GET_LOCATIONS);
  const [createLocation] = useMutation(CREATE_LOCATION);
  const [deleteLocation] = useMutation(DELETE_LOCATION);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  const hideDialog = () => {
    setDialogVisible(false);
    setName('');
    setDescription('');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Location name is required');
      return;
    }

    try {
      await createLocation({
        variables: {
          input: {
            name: name.trim(),
            description: description.trim() || undefined,
          },
        },
      });
      hideDialog();
      refetch();
      Alert.alert('Success', 'Location created successfully');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create location'
      );
    }
  };

  const confirmDelete = (id: string) => {
    setLocationToDelete(id);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation({
        variables: {
          id: locationToDelete,
        },
      });
      setDeleteDialogVisible(false);
      refetch();
      Alert.alert('Success', 'Location deleted successfully');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete location'
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <ThemedText style={styles.locationName}>{item.name}</ThemedText>
            {item.description && (
              <ThemedText style={styles.locationDescription}>
                {item.description}
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.itemCount}>
            {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => router.push(`./?location=${item.id}`)}>
          View Items
        </Button>
        <Button icon="delete" onPress={() => confirmDelete(item.id)}>
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol
          name="mappin.and.ellipse"
          size={24}
          color={Colors.light.icon}
        />
        <ThemedText style={styles.title}>Locations</ThemedText>
      </ThemedView>

      {loading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={data?.locations || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="mappin" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>
                No locations found
              </ThemedText>
              <Button
                mode="contained"
                onPress={() => setDialogVisible(true)}
                icon="plus"
              >
                Add Location
              </Button>
            </ThemedView>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Add New Location</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Location Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={handleCreate}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Location</Dialog.Title>
          <Dialog.Content>
            <ThemedText>
              Are you sure you want to delete this location? This action cannot
              be undone.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleDelete} textColor={Colors.light.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  loading: {
    marginTop: 20,
  },
  list: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    backgroundColor: Colors.light.cardBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  itemCount: {
    fontSize: 14,
    backgroundColor: Colors.light.tint + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.tint,
  },
  input: {
    marginBottom: 16,
  },
});
