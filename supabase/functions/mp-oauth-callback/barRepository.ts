/**
 * Bar Repository
 * Responsável por operações de persistência relacionadas a bares
 */

import type { BarUpdateData } from "./types.ts";

export class BarRepository {
  private supabaseUrl: string;
  private serviceKey: string;

  constructor(supabaseUrl: string, serviceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.serviceKey = serviceKey;
  }

  /**
   * Atualiza os tokens OAuth de um bar
   */
  async updateOAuthTokens(barId: string, data: BarUpdateData): Promise<void> {
    if (!barId || barId.trim().length === 0) {
      throw new Error("ID do bar não pode ser vazio");
    }

    console.log(`💾 Salvando tokens OAuth para bar: ${barId}`);

    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/bars?id=eq.${barId}`,
      {
        method: "PATCH",
        headers: {
          apikey: this.serviceKey,
          Authorization: `Bearer ${this.serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao atualizar bar:", {
        status: response.status,
        error: errorText,
      });
      throw new Error(
        `Falha ao atualizar bar no banco: ${response.status} ${errorText}`
      );
    }

    // Verificar se o bar foi encontrado e atualizado
    const updatedBars = await response.json() as Array<{ id: string }>;
    if (!Array.isArray(updatedBars) || updatedBars.length === 0) {
      throw new Error(`Bar com ID ${barId} não encontrado`);
    }

    console.log("✅ Tokens salvos com sucesso no banco de dados");
  }

  /**
   * Verifica se um bar existe
   */
  async barExists(barId: string): Promise<boolean> {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/bars?id=eq.${barId}&select=id`,
      {
        method: "GET",
        headers: {
          apikey: this.serviceKey,
          Authorization: `Bearer ${this.serviceKey}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const bars = await response.json();
    return Array.isArray(bars) && bars.length > 0;
  }
}

