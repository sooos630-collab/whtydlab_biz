import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  dummyClients, dummyRequests,
  type Client, type SalesRequest, type InquiryRecord,
} from "@/data/dummy-sales";

interface CustomerContextValue {
  clients: Client[];
  requests: SalesRequest[];
  // 고객 CRUD
  updateClient: (updated: Client) => void;
  addClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  // 의뢰 CRUD
  updateRequest: (updated: SalesRequest) => void;
  addRequest: (request: SalesRequest) => void;
  deleteRequest: (id: string) => void;
  // 연동 로직
  registerClientFromRequest: (request: SalesRequest) => Client;
  convertToCustomer: (clientId: string) => void;
  changeRequestStatus: (requestId: string, newStatus: SalesRequest["status"]) => void;
  // 조회
  getClientByCompany: (company: string) => Client | undefined;
  getClientById: (id: string) => Client | undefined;
  getRequestsByClientId: (clientId: string) => SalesRequest[];
  // 계약 연동
  linkContract: (clientId: string, contractId: string) => void;
  updateClientRevenue: (clientId: string, revenue: number, projectCount: number) => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => dummyClients.map(c => ({ ...c })));
  const [requests, setRequests] = useState<SalesRequest[]>(() => dummyRequests.map(r => ({ ...r })));

  const updateClient = useCallback((updated: Client) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  const addClient = useCallback((client: Client) => {
    setClients(prev => [client, ...prev]);
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateRequest = useCallback((updated: SalesRequest) => {
    setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const addRequest = useCallback((request: SalesRequest) => {
    setRequests(prev => [request, ...prev]);
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const getClientByCompany = useCallback((company: string) => {
    return clients.find(c => c.company === company);
  }, [clients]);

  const getClientById = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const getRequestsByClientId = useCallback((clientId: string) => {
    return requests.filter(r => r.client_id === clientId);
  }, [requests]);

  // 의뢰 등록 시 → 고객DB에 잠재고객으로 자동 등록 (이미 존재하면 문의이력만 추가)
  const registerClientFromRequest = useCallback((request: SalesRequest): Client => {
    const existing = clients.find(c => c.company === request.client);
    if (existing) {
      // 문의이력 추가
      const newInquiry: InquiryRecord = {
        id: "inq-" + Date.now(),
        date: request.created_at,
        type: request.type,
        channel: request.source,
        summary: request.title,
        status: request.status,
        linked_request_id: request.id,
      };
      const updated = {
        ...existing,
        last_contact_date: request.created_at,
        source_request_ids: [...existing.source_request_ids, request.id],
        inquiry_history: [...existing.inquiry_history, newInquiry],
      };
      setClients(prev => prev.map(c => c.id === existing.id ? updated : c));
      // 의뢰에 client_id 연결
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, client_id: existing.id } : r));
      return updated;
    }

    // 신규 잠재고객 생성
    const newClient: Client = {
      id: "cli-" + Date.now(),
      company: request.client,
      contact_name: request.contact_name,
      contact_email: request.contact_email,
      contact_phone: request.contact_phone,
      grade: "잠재",
      client_status: "잠재고객",
      industry: "",
      total_revenue: 0,
      project_count: 0,
      last_contact_date: request.created_at,
      memo: request.title,
      source_request_ids: [request.id],
      contract_ids: [],
      inquiry_history: [{
        id: "inq-" + Date.now(),
        date: request.created_at,
        type: request.type,
        channel: request.source,
        summary: request.title,
        status: request.status,
        linked_request_id: request.id,
      }],
    };
    setClients(prev => [newClient, ...prev]);
    // 의뢰에 client_id 연결
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, client_id: newClient.id } : r));
    return newClient;
  }, [clients]);

  // 잠재고객 → 고객사 전환
  const convertToCustomer = useCallback((clientId: string) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, client_status: "고객사" as const, grade: c.grade === "잠재" ? "일반" as const : c.grade } : c
    ));
  }, []);

  // 의뢰 상태 변경 + 자동 연동
  const changeRequestStatus = useCallback((requestId: string, newStatus: SalesRequest["status"]) => {
    setRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r);
      const request = updated.find(r => r.id === requestId);

      if (request) {
        // 문의이력 상태도 업데이트
        if (request.client_id) {
          setClients(prevClients => prevClients.map(c => {
            if (c.id !== request.client_id) return c;
            const updatedHistory = c.inquiry_history.map(h =>
              h.linked_request_id === requestId ? { ...h, status: newStatus } : h
            );
            return { ...c, inquiry_history: updatedHistory, last_contact_date: new Date().toISOString().split("T")[0] };
          }));
        }

        // 수주 전환 시 → 고객사로 전환
        if (newStatus === "수주" && request.client_id) {
          setClients(prevClients => prevClients.map(c =>
            c.id === request.client_id
              ? { ...c, client_status: "고객사" as const, grade: c.grade === "잠재" ? "일반" as const : c.grade }
              : c
          ));
        }
      }

      return updated;
    });
  }, []);

  // 계약 연동
  const linkContract = useCallback((clientId: string, contractId: string) => {
    setClients(prev => prev.map(c =>
      c.id === clientId && !c.contract_ids.includes(contractId)
        ? { ...c, contract_ids: [...c.contract_ids, contractId] }
        : c
    ));
  }, []);

  const updateClientRevenue = useCallback((clientId: string, revenue: number, projectCount: number) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, total_revenue: revenue, project_count: projectCount } : c
    ));
  }, []);

  return (
    <CustomerContext.Provider value={{
      clients, requests,
      updateClient, addClient, deleteClient,
      updateRequest, addRequest, deleteRequest,
      registerClientFromRequest, convertToCustomer, changeRequestStatus,
      getClientByCompany, getClientById, getRequestsByClientId,
      linkContract, updateClientRevenue,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomerProvider");
  return ctx;
}
