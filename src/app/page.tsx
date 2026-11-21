"use client";

import { Button, Card, Chip, Table } from "@heroui/react";
import { formatDate, formatDay, greeting, nextBirthday, shortName, todayISO } from "@/lib/format";
import { CLINIC_NAME, phraseKindLabel, statusLabel, STATUS_COLOR } from "@/lib/labels";
import { promotionIsCurrent } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function DashboardPage() {
  const { db, admin } = useStore();
  const today = todayISO();
  const todayAppointments = db.appointments
    .filter((item) => item.date === today && item.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));
  const activeDoctors = db.doctors.filter((item) => item.active).length;
  const activeServices = db.services.filter((item) => item.active).length;
  const activePromos = db.promotions.filter((item) => promotionIsCurrent(item));

  const birthdays = new Map<string, { name: string; days: number; date: string }>();
  for (const appointment of db.appointments) {
    const next = nextBirthday(appointment.patientBirthDate);
    if (!next || next.days > 14) continue;
    const key = `${appointment.patientName}|${appointment.patientBirthDate}`;
    if (!birthdays.has(key)) {
      birthdays.set(key, { name: appointment.patientName, days: next.days, date: next.date });
    }
  }
  const upcomingBirthdays = [...birthdays.values()].sort((a, b) => a.days - b.days);

  const stats = [
    { label: "Записей сегодня", value: todayAppointments.length, href: "/schedule" },
    { label: "Врачей на приёме", value: activeDoctors, href: "/doctors" },
    { label: "Услуг в прайсе", value: activeServices, href: "/services" },
    { label: "Активных акций", value: activePromos.length, href: "/promotions" },
  ];

  return (
    <div>
      <p className="text-sm text-muted">
        {formatDate(today)} · {CLINIC_NAME}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {greeting()}, {admin?.name.split(" ")[0]}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Сегодня в расписании {todayAppointments.length} визитов. Акции уже учитываются в прайсе, а дни рождения
        пациентов можно поздравить готовой фразой.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full">
              <Card.Content className="px-5 py-4">
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
              </Card.Content>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Card>
          <Card.Header className="flex items-center justify-between gap-3">
            <div>
              <Card.Title>Расписание на сегодня</Card.Title>
              <Card.Description>Без отменённых записей</Card.Description>
            </div>
            <Link href="/schedule">
              <Button size="sm" variant="secondary">
                Открыть неделю
              </Button>
            </Link>
          </Card.Header>
          <Card.Content>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted">На сегодня записей нет.</p>
            ) : (
              <Table variant="secondary">
                <Table.ScrollContainer>
                  <Table.Content aria-label="Записи на сегодня">
                    <Table.Header>
                      <Table.Column isRowHeader>Время</Table.Column>
                      <Table.Column>Пациент</Table.Column>
                      <Table.Column>Врач</Table.Column>
                      <Table.Column>Статус</Table.Column>
                    </Table.Header>
                    <Table.Body items={todayAppointments}>
                      {(item) => {
                        const doctor = db.doctors.find((entry) => entry.id === item.doctorId);
                        return (
                          <Table.Row id={item.id}>
                            <Table.Cell>
                              {item.start}–{item.end}
                            </Table.Cell>
                            <Table.Cell>{item.patientName}</Table.Cell>
                            <Table.Cell>{doctor ? shortName(doctor.fullName) : "—"}</Table.Cell>
                            <Table.Cell>
                              <Chip color={STATUS_COLOR[item.status]} size="sm" variant="soft">
                                {statusLabel(item.status)}
                              </Chip>
                            </Table.Cell>
                          </Table.Row>
                        );
                      }}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}
          </Card.Content>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <Card.Header>
              <Card.Title>Дни рождения</Card.Title>
              <Card.Description>Пациенты из записей, ближайшие 14 дней</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {upcomingBirthdays.length === 0 ? (
                <p className="text-sm text-muted">Ближайших дней рождения нет.</p>
              ) : (
                upcomingBirthdays.map((item) => (
                  <div key={`${item.name}-${item.date}`} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted">{formatDay(item.date)}</p>
                    </div>
                    <Chip color={item.days === 0 ? "warning" : "accent"} size="sm" variant="soft">
                      {item.days === 0 ? "сегодня" : `через ${item.days} дн.`}
                    </Chip>
                  </div>
                ))
              )}
              <Link className="text-sm font-medium text-accent" href="/phrases">
                Открыть фразу поздравления
              </Link>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>Акции сейчас</Card.Title>
              <Card.Description>{activePromos.length === 0 ? "Нет действующих скидок" : "Учитываются в прайсе"}</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {activePromos.map((promo) => (
                <div key={promo.id}>
                  <p className="text-sm font-medium">{promo.title}</p>
                  <p className="text-xs text-muted">
                    {promo.code} · до {formatDay(promo.endsOn)}
                  </p>
                </div>
              ))}
              <p className="text-xs text-muted">
                Активных шаблонов сообщений: {db.phrases.filter((item) => item.active).length}. Среди них{" "}
                {phraseKindLabel("birthday").toLowerCase()}.
              </p>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
