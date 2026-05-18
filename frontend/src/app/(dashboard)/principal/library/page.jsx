"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from "@/components/ui";
import libraryService from "@/services/libraryService";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    shelf: "",
    totalCopies: 1,
    active: true,
  });

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const res = await libraryService.listBooks({ q: query || undefined });
      setBooks(Array.isArray(res?.books) ? res.books : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = books.filter(
    (b) =>
      !query ||
      [b.title, b.author, b.category].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Books"
        subtitle="View Library Books"
      />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="flex w-full">
        <Card className="md:col-span-2">
          <h2 className="font-semibold mb-3">Search</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadBooks} size="sm">
              Refresh
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        {loading ? (
          <Skeleton className="h-40" />
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-600">No books.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Title</th>
                  <th className="py-2 px-3">Author</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3">Available</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id} className="border-b">
                    <td className="py-2 px-3">{b.title}</td>
                    <td className="py-2 px-3 text-sm">{b.author || "-"}</td>
                    <td className="py-2 px-3 text-sm">{b.category || "-"}</td>
                    <td className="py-2 px-3 text-center">{b.totalCopies}</td>
                    <td className="py-2 px-3 text-center">
                      {b.availableCopies}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
