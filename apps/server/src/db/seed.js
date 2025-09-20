"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@seo-portal.com' },
        update: {},
        create: {
            email: 'admin@seo-portal.com',
            name: 'Admin User',
            role: client_1.UserRole.ADMIN,
        },
    });
    // Create analyst user
    const analystUser = await prisma.user.upsert({
        where: { email: 'analyst@seo-portal.com' },
        update: {},
        create: {
            email: 'analyst@seo-portal.com',
            name: 'Analyst User',
            role: client_1.UserRole.ANALYST,
        },
    });
    // Create marketer user
    const marketerUser = await prisma.user.upsert({
        where: { email: 'marketer@seo-portal.com' },
        update: {},
        create: {
            email: 'marketer@seo-portal.com',
            name: 'Marketer User',
            role: client_1.UserRole.MARKETER,
        },
    });
    // Create sample project
    const sampleProject = await prisma.project.upsert({
        where: { id: 'sample-project-id' },
        update: {},
        create: {
            id: 'sample-project-id',
            name: 'Sample SEO Research Project',
            description: 'A sample project to demonstrate the SEO research portal capabilities',
            ownerId: adminUser.id,
        },
    });
    // Add project members
    await prisma.projectMember.upsert({
        where: {
            projectId_userId: {
                projectId: sampleProject.id,
                userId: analystUser.id,
            },
        },
        update: {},
        create: {
            projectId: sampleProject.id,
            userId: analystUser.id,
            role: 'EDITOR',
        },
    });
    await prisma.projectMember.upsert({
        where: {
            projectId_userId: {
                projectId: sampleProject.id,
                userId: marketerUser.id,
            },
        },
        update: {},
        create: {
            projectId: sampleProject.id,
            userId: marketerUser.id,
            role: 'VIEWER',
        },
    });
    // Create default budgets for different roles
    const budgets = [
        {
            role: client_1.UserRole.ADMIN,
            unit: client_1.BudgetUnit.USD,
            limit: 1000,
            period: client_1.BudgetPeriod.MONTHLY,
        },
        {
            role: client_1.UserRole.ANALYST,
            unit: client_1.BudgetUnit.USD,
            limit: 500,
            period: client_1.BudgetPeriod.MONTHLY,
        },
        {
            role: client_1.UserRole.MARKETER,
            unit: client_1.BudgetUnit.USD,
            limit: 100,
            period: client_1.BudgetPeriod.MONTHLY,
        },
    ];
    for (const budget of budgets) {
        const resetAt = new Date();
        resetAt.setMonth(resetAt.getMonth() + 1);
        await prisma.budget.upsert({
            where: {
                id: `budget-${budget.role.toLowerCase()}`,
            },
            update: {},
            create: {
                id: `budget-${budget.role.toLowerCase()}`,
                role: budget.role,
                unit: budget.unit,
                limit: budget.limit,
                period: budget.period,
                resetAt,
            },
        });
    }
    // Create sample datasets for demonstration
    const keywordDataset = await prisma.dataset.create({
        data: {
            projectId: sampleProject.id,
            name: 'Sample Keyword Research',
            kind: 'KEYWORDS',
            meta: {
                query: 'SEO tools',
                location: 'United States',
                language: 'English',
                device: 'desktop',
            },
            data: {
                keywords: [
                    {
                        keyword: 'SEO tools',
                        search_volume: 12100,
                        cpc: 5.67,
                        competition: 0.8,
                        difficulty: 65,
                    },
                    {
                        keyword: 'keyword research tool',
                        search_volume: 8100,
                        cpc: 7.23,
                        competition: 0.7,
                        difficulty: 58,
                    },
                    {
                        keyword: 'SERP analysis',
                        search_volume: 1900,
                        cpc: 4.12,
                        competition: 0.6,
                        difficulty: 45,
                    },
                ],
            },
        },
    });
    console.log('✅ Database seeded successfully!');
    console.log({
        users: { admin: adminUser.id, analyst: analystUser.id, marketer: marketerUser.id },
        project: sampleProject.id,
        dataset: keywordDataset.id,
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
});
