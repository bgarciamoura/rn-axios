import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Button,
  TextInput,
} from "react-native";
import { User } from "@domain/entities/User";
import {
  useUsers,
  useUserByEmail,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@hooks/queries";

const UserScreen = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");

  // Query para listar todos os usuários
  const { data: users, isLoading, isError, error, refetch } = useUsers();

  // Query por email (disparada apenas quando o email for fornecido)
  const {
    data: userByEmail,
    isLoading: isLoadingEmail,
    isError: isErrorEmail,
    error: emailError,
  } = useUserByEmail(searchEmail, {
    enabled: searchEmail.length > 0,
    onSuccess: (user) => {
      if (user) {
        setSelectedUser(user);
        setEditName(user.name);
      }
    },
  });

  // Mutations
  const createUser = useCreateUser({
    onSuccess: () => {
      refetch();
      setEditName("");
    },
  });

  const updateUser = useUpdateUser({
    onSuccess: () => {
      refetch();
      setSelectedUser(null);
      setEditName("");
    },
  });

  const deleteUser = useDeleteUser({
    onSuccess: () => {
      refetch();
      setSelectedUser(null);
    },
  });

  // Handlers
  const handleCreate = () => {
    createUser.mutate({
      name: editName,
      email: `user-${Date.now()}@example.com`,
      role: "user",
    });
  };

  const handleUpdate = () => {
    if (selectedUser) {
      updateUser.mutate({
        id: selectedUser.id,
        data: { name: editName },
      });
    }
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteUser.mutate(selectedUser.id);
    }
  };

  const handleSearch = () => {
    // A busca por email é disparada automaticamente pelo useQuery quando searchEmail muda
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#0000ff' />
      </View>
    );
  }

  if (isError && error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro: {error.message}</Text>
        <Button title='Tentar novamente' onPress={() => refetch()} />
      </View>
    );
  }

  console.log("Users data:", users);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuários</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder='Buscar por email'
          value={searchEmail}
          onChangeText={setSearchEmail}
        />
        <Button title='Buscar' onPress={handleSearch} />
      </View>

      {isLoadingEmail && <ActivityIndicator size='small' color='#0000ff' />}

      {isErrorEmail && emailError && (
        <Text style={styles.errorText}>Erro na busca: {emailError.message}</Text>
      )}

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder='Nome do usuário'
          value={editName}
          onChangeText={setEditName}
        />
        <View style={styles.buttonRow}>
          <Button
            title={selectedUser ? "Atualizar" : "Criar"}
            onPress={selectedUser ? handleUpdate : handleCreate}
          />
          {selectedUser && <Button title='Deletar' onPress={handleDelete} color='red' />}
          {selectedUser && (
            <Button
              title='Cancelar'
              onPress={() => {
                setSelectedUser(null);
                setEditName("");
                setSearchEmail("");
              }}
            />
          )}
        </View>
      </View>

      <FlatList
        data={users.content}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[styles.userItem, selectedUser?.id === item.id ? styles.selectedItem : null]}
          >
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Button
              title='Selecionar'
              onPress={() => {
                setSelectedUser(item);
                setEditName(item.name);
                setSearchEmail(item.email);
              }}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  formContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  selectedItem: {
    backgroundColor: "#e6f7ff",
    borderColor: "#1890ff",
    borderWidth: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
});

export default UserScreen;
