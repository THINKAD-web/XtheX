"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { MediaCategory, MediaStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createDemoMedias() {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    throw new Error("로그인이 필요합니다.");
  }
  if (dbUser.role !== UserRole.ADMIN) {
    throw new Error("관리자만 데모 매체를 생성할 수 있습니다.");
  }

  const baseUserId = dbUser.id;

  const demoItems = [
    {
      mediaName: "강남역 4번 출구 대형 LED 전광판 (DEMO)",
      category: MediaCategory.DIGITAL_BOARD,
      description: "강남역 4번 출구 앞 보행자 동선 중심의 대형 디지털 보드.",
      locationJson: {
        address: "서울특별시 강남구 강남대로 408, 강남역 4번 출구 앞",
        district: "강남구",
        lat: 37.49794,
        lng: 127.02762,
      },
      price: 25000000,
      cpm: 9500,
      exposureJson: {
        daily_traffic: "약 250,000명/일",
        monthly_impressions: "약 7,500,000회",
      },
      targetAudience: "20~30대 직장인, 대학생",
      images: ["https://picsum.photos/960/640?random=21"],
      tags: ["DEMO", "강남역", "디지털보드"],
      audienceTags: ["20대", "오피스워커", "대학생층"],
      pros: "서울 핵심 상권, 야간 시인성 우수.",
      cons: "집행 단가가 높은 편입니다.",
      trustScore: 82,
    },
    {
      mediaName: "서울역 KTX 광장 래핑 (DEMO)",
      category: MediaCategory.TRANSIT,
      description: "서울역 KTX 광장 전체를 커버하는 대형 래핑 매체.",
      locationJson: {
        address: "서울특별시 용산구 청파로 378, 서울역 KTX 광장",
        district: "용산구",
        lat: 37.55465,
        lng: 126.9706,
      },
      price: 18000000,
      cpm: 7200,
      exposureJson: {
        daily_traffic: "약 180,000명/일",
      },
      targetAudience: "전국 비즈니스 고객, 여행객",
      images: ["https://picsum.photos/960/640?random=22"],
      tags: ["DEMO", "서울역", "교통매체"],
      audienceTags: ["오피스워커", "관광객", "유동인구"],
      pros: "전국 단위 도달, 브랜드 임팩트 강함.",
      cons: "제작 및 설치 리드타임이 깁니다.",
      trustScore: 78,
    },
    {
      mediaName: "홍대입구 사거리 옥상 빌보드 (DEMO)",
      category: MediaCategory.BILLBOARD,
      description: "홍대입구 사거리 상권을 커버하는 대형 옥상 보드.",
      locationJson: {
        address: "서울특별시 마포구 양화로 160, 홍대입구 사거리",
        district: "마포구",
        lat: 37.55634,
        lng: 126.9237,
      },
      price: 12000000,
      cpm: 6800,
      exposureJson: {
        daily_traffic: "약 150,000명/일",
      },
      targetAudience: "20~30대, F&B, 패션, 라이프스타일 브랜드",
      images: ["https://picsum.photos/960/640?random=23"],
      tags: ["DEMO", "홍대입구", "빌보드"],
      audienceTags: ["20대", "30대", "쇼핑러"],
      pros: "트렌디 상권, 야간/주말 유동인구 풍부.",
      cons: "날씨 및 시야각에 따라 효과 변동.",
      trustScore: 80,
    },
  ];

  await prisma.media.createMany({
    data: demoItems.map((m) => ({
      ...m,
      status: MediaStatus.PUBLISHED,
      createdById: baseUserId,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/medias");
  revalidatePath("/explore");
}

