import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { HttpError } from "../infra/http";

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  let errorMessage = "Um erro inesperado ocorreu";
  let errorDetails = "";

  if (error instanceof HttpError) {
    errorMessage = `Erro ${error.statusCode}: ${error.message}`;
    if (error.response) {
      errorDetails = JSON.stringify(error.response, null, 2);
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || "";
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorTitle}>Algo deu errado!</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      {__DEV__ && errorDetails && <Text style={styles.errorDetails}>{errorDetails}</Text>}
      <Button title='Tentar novamente' onPress={resetErrorBoundary} />
    </View>
  );
};

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ children }) => {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#e53935",
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  errorDetails: {
    fontSize: 12,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    maxWidth: "100%",
  },
});
