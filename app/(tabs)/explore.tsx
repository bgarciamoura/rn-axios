import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Button,
  TextInput,
  RefreshControl,
} from "react-native";
import { User } from "@domain/entities/User";
import { useUsersPaginated } from "@hooks/queries";

const UsersPaginatedScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});

  // Infinite Query para usuários com paginação
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useUsersPaginated(searchParams);

  // Extrair todos os usuários de todas as páginas
  const users = data?.pages.flatMap((page) => page.data) || [];

  // Handlers
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchParams({ name: searchTerm });
    } else {
      setSearchParams({});
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Renderizar o item do usuário
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Text style={styles.userRole}>Função: {item.role}</Text>
    </View>
  );

  // Renderizar o indicador de carregamento no final da lista
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size='small' color='#0000ff' />
        <Text style={styles.footerText}>Carregando mais...</Text>
      </View>
    );
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuários (Paginado)</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder='Buscar por nome'
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <Button title='Buscar' onPress={handleSearch} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderUserItem}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={["#0000ff"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        }
      />

      {hasNextPage && (
        <Button title='Carregar mais' onPress={handleLoadMore} disabled={isFetchingNextPage} />
      )}
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
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
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  userRole: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default UsersPaginatedScreen;
